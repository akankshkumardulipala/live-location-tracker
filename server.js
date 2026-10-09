require("dotenv").config();
const express=require("express"), session=require("express-session"), http=require("http"), crypto=require("crypto");
const {Server}=require("socket.io");
const app=express(), server=http.createServer(app), io=new Server(server);
const PORT=process.env.PORT||6589, USERNAME=process.env.APP_USERNAME||"admin", PASSWORD=process.env.APP_PASSWORD, SESSION_SECRET=process.env.SESSION_SECRET;
if(!PASSWORD||!SESSION_SECRET) console.warn("Set APP_PASSWORD and SESSION_SECRET before deployment.");
app.set("trust proxy",1); app.use(express.json({limit:"20kb"}));
const sessionMiddleware=session({name:"llt.sid",secret:SESSION_SECRET||"development-only-change-this-secret",resave:false,saveUninitialized:false,cookie:{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",maxAge:8*60*60*1000}});
app.use(sessionMiddleware); app.use(express.static("public"));
const isAuth=req=>Boolean(req.session&&req.session.authenticated===true);
function requireAuth(req,res,next){if(!isAuth(req))return res.status(401).json({error:"Please sign in first."});next();}
app.get("/api/status",(req,res)=>res.json({authenticated:isAuth(req)}));
app.post("/api/login",(req,res)=>{
 const {username,password}=req.body||{};
 if(!PASSWORD)return res.status(503).json({error:"Server login is not configured. Set APP_PASSWORD and restart."});
 const userOk=typeof username==="string"&&username===USERNAME;
 const passOk=typeof password==="string"&&Buffer.byteLength(password)===Buffer.byteLength(PASSWORD)&&crypto.timingSafeEqual(Buffer.from(password),Buffer.from(PASSWORD));
 if(!userOk||!passOk)return res.status(401).json({error:"Incorrect username or password."});
 req.session.regenerate(err=>{if(err)return res.status(500).json({error:"Could not create a secure session."});req.session.authenticated=true;req.session.save(e=>e?res.status(500).json({error:"Could not save session."}):res.json({ok:true}));});
});
const rooms=new Map(); // Room codes and ownership only; GPS coordinates are never persisted.
app.post("/api/logout",requireAuth,(req,res)=>{for(const [code,room] of rooms.entries()){if(room.ownerSessionId===req.sessionID){io.to(code).emit("sharing-stopped");rooms.delete(code);}}req.session.destroy(()=>res.json({ok:true}));});
io.use((socket,next)=>sessionMiddleware(socket.request,{},()=>{if(socket.request.session&&socket.request.session.authenticated===true){socket.sessionId=socket.request.sessionID;return next();}next(new Error("Authentication required"));}));
io.on("connection",socket=>{
 socket.on("create-room",callback=>{if(typeof callback!=="function")return;for(const [oldCode,room] of rooms.entries()){if(room.ownerSessionId===socket.sessionId){io.to(oldCode).emit("sharing-stopped");rooms.delete(oldCode);}}const code=crypto.randomBytes(4).toString("hex").toUpperCase();rooms.set(code,{ownerSessionId:socket.sessionId,ownerSocketId:socket.id});socket.join(code);callback({ok:true,code});});
 socket.on("join-room",(rawCode,callback)=>{if(typeof callback!=="function")return;const code=typeof rawCode==="string"?rawCode.trim().toUpperCase():"";if(!/^[A-F0-9]{8}$/.test(code)||!rooms.has(code))return callback({ok:false,error:"That sharing code is invalid or no longer active."});socket.join(code);callback({ok:true});});
 socket.on("location-update",payload=>{if(!payload||typeof payload.code!=="string")return;const code=payload.code.trim().toUpperCase(),room=rooms.get(code);if(!room||room.ownerSessionId!==socket.sessionId||room.ownerSocketId!==socket.id)return;const lat=Number(payload.latitude),lng=Number(payload.longitude);if(!Number.isFinite(lat)||!Number.isFinite(lng)||lat < -90||lat>90||lng < -180||lng>180)return;io.to(code).emit("location-update",{latitude:lat,longitude:lng,accuracy:Number.isFinite(Number(payload.accuracy))?Math.max(0,Number(payload.accuracy)):null,timestamp:Date.now()});});
 socket.on("stop-sharing",code=>{if(typeof code!=="string")return;const key=code.trim().toUpperCase(),room=rooms.get(key);if(!room||room.ownerSessionId!==socket.sessionId||room.ownerSocketId!==socket.id)return;rooms.delete(key);io.to(key).emit("sharing-stopped");});
});
server.listen(PORT,()=>console.log(`Live Location Tracker running on port ${PORT}`));