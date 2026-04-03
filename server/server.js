require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs');
const path = require('path'); // <-- NAYA: Path module for viewing files
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 5000;
const SECRET_KEY = "super_secret_key";
const ADMIN_KEY = "master_key_v1"; 

// --- MONGODB CONNECTION ---
const MONGO_URI = process.env.MONGO_URI; 

mongoose.connect(MONGO_URI)
    .then(() => console.log("🟢 MONGODB SECURE CONNECTION ESTABLISHED"))
    .catch(err => console.log("🔴 MONGODB CONNECTION FAILED:", err));

app.use(cors());
app.use(bodyParser.json());

// --- ENSURE UPLOADS DIRECTORY EXISTS ---
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}

// --- MONGOOSE SCHEMAS & MODELS ---
const SettingSchema = new mongoose.Schema({
    allowedDomain: String,
    idPattern: String,
    lockdown: Boolean,
    sectors: Array
});
const Setting = mongoose.model('Setting', SettingSchema);

const UserSchema = new mongoose.Schema({
    id: String, fullName: String, email: String, username: String, password: String, role: String, isTrapped: Boolean
});
const User = mongoose.model('User', UserSchema);

const FileSchema = new mongoose.Schema({
    id: String, filename: String, originalName: String, filePath: String, 
    department: String, owner: String, status: String, createdAt: { type: Date, default: Date.now }
});
const FileModel = mongoose.model('File', FileSchema);

const RequestSchema = new mongoose.Schema({
    id: String, userId: String, username: String, department: String, duration: Number, reason: String,
    status: String, requestedAt: Date, expiresAt: Date
});
const Request = mongoose.model('Request', RequestSchema);

const LogSchema = new mongoose.Schema({
    id: String, timestamp: Date, type: String, user: String, message: String
});
const Log = mongoose.model('Log', LogSchema);

// --- INITIALIZE DEFAULT SETTINGS ---
const initSettings = async () => {
    const count = await Setting.countDocuments();
    if (count === 0) {
        await Setting.create({
            allowedDomain: "@securevault.com", 
            idPattern: "^[A-Z]{2,5}-\\d{4,6}$", 
            lockdown: false,
            sectors: [
                { name: 'HR', level: 'High' }, { name: 'Finance', level: 'High' }, 
                { name: 'IT', level: 'Medium' }, { name: 'Legal', level: 'High' }, 
                { name: 'Operations', level: 'Low' }
            ]
        });
        console.log("⚙️ Default Policies Initialized in MongoDB");
    }
};
initSettings();

// --- MULTER & SECURITY FILTER ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'))
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'text/plain', 'text/csv', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('SECURITY_BREACH_INVALID_FILE'), false);
    }
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } }); 

// --- HELPERS ---
const logEvent = async (type, user, message) => {
    await Log.create({ id: uuidv4(), timestamp: new Date(), type, user, message });
};

const isValidPassword = (pwd) => /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/.test(pwd);

const securityLayer = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(403).json({ message: "No token" });
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded; 
        const settings = await Setting.findOne();
        if (settings.lockdown && req.user.role !== 'admin') return res.status(503).json({ message: "⛔ LOCKDOWN" });
        next();
    } catch (e) { res.status(401).json({ message: "Invalid Token" }); }
};

// --- ROUTES ---

app.get('/public-settings', async (req, res) => {
    const settings = await Setting.findOne();
    res.json({ idPattern: settings.idPattern, allowedDomain: settings.allowedDomain, lockdown: settings.lockdown });
});

app.post('/register', async (req, res) => {
    const settings = await Setting.findOne();
    if (settings.lockdown) return res.status(503).json({ message: "LOCKDOWN" });
    
    const { fullName, email, username, password } = req.body; 
    
    if (settings.allowedDomain && !email.endsWith(settings.allowedDomain)) {
        return res.status(400).json({ message: `Strict Policy: Email must end with ${settings.allowedDomain}` });
    }

    if (!isValidPassword(password)) return res.status(400).json({ message: "Weak Password" });
    if (!new RegExp(settings.idPattern).test(username)) return res.status(400).json({ message: "Invalid ID Format" });

    const existingUser = await User.findOne({ $or: [{ username: username }, { email: email }] });
    if (existingUser) {
        if (existingUser.username === username) {
            return res.status(400).json({ message: "Corporate ID is already taken!" });
        }
        if (existingUser.email === email) {
            return res.status(400).json({ message: "This Email is already registered!" });
        }
    }
    
    await User.create({ id: uuidv4(), fullName, email, username, password, role: 'agent', isTrapped: false });
    await logEvent('INFO', username, 'Registered');
    res.json({ message: "Registered." });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (username === 'sys_admin' && password === ADMIN_KEY) {
        const token = jwt.sign({ id: 'root', role: 'admin' }, SECRET_KEY);
        return res.json({ token, username: 'root', role: 'admin' });
    }

    const settings = await Setting.findOne();
    if (settings.lockdown) return res.status(503).json({ message: "SYSTEM LOCKDOWN" });

    const INJECTION_PATTERNS = ["'", " or ", "1=1", "--", "/*", "*/", ";", "drop table", "union select", "admin'", "sleep(", "exec("];
    if (INJECTION_PATTERNS.some(p => username.toLowerCase().includes(p))) {
        await logEvent('ALERT', 'INTRUDER', `SQL Injection Detected: ${username}`);
        const token = jwt.sign({ id: uuidv4(), role: 'trapped_ghost' }, SECRET_KEY);
        return res.json({ token, username: "Unknown", fullName: "Unknown", role: 'trapped_ghost' });
    }

    const user = await User.findOne({ username, password });
    if (user) {
        if (!new RegExp(settings.idPattern).test(username)) {
            return res.status(409).json({ message: "MIGRATION_REQUIRED", oldId: username });
        }
        await logEvent('INFO', user.username, 'Login');
        const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY);
        res.json({ token, username: user.username, fullName: user.fullName, role: user.role });
    } else {
        await logEvent('WARN', username, 'Failed Login');
        res.status(401).json({ message: "Invalid credentials" });
    }
});

app.post('/migrate-id', async (req, res) => {
    const { oldId, password, newId } = req.body;
    const settings = await Setting.findOne();
    
    const user = await User.findOne({ username: oldId, password });
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    if (!new RegExp(settings.idPattern).test(newId)) return res.status(400).json({ message: `New ID must match ${settings.idPattern}` });
    if (await User.findOne({ username: newId })) return res.status(400).json({ message: "New ID already taken" });

    await User.updateOne({ id: user.id }, { $set: { username: newId } });
    await FileModel.updateMany({ owner: oldId }, { $set: { owner: newId } });
    await Log.updateMany({ user: oldId }, { $set: { user: newId } });
    await Request.updateMany({ username: oldId }, { $set: { username: newId } });

    await logEvent('INFO', newId, `Migrated from ${oldId}`);
    res.json({ success: true });
});

app.get('/dashboard-stats', securityLayer, async (req, res) => {
    const user = await User.findOne({ id: req.user.id });
    const settings = await Setting.findOne();
    const requests = await Request.find({ userId: req.user.id, status: 'Approved', expiresAt: { $gt: new Date() } });
    
    const stats = {};
    for (const sector of settings.sectors) {
        const name = typeof sector === 'string' ? sector : sector.name;
        const totalFiles = await FileModel.countDocuments({ department: name });
        const activeAccess = requests.find(r => r.department === name);

        stats[name] = { 
            count: totalFiles, hasAccess: !!activeAccess, 
            expiresAt: activeAccess ? activeAccess.expiresAt : null,
            securityLevel: typeof sector === 'string' ? 'High' : sector.level 
        };
    }
    res.json({ stats, fullName: user.fullName, username: user.username });
});

app.post('/department-data', securityLayer, async (req, res) => {
    const { department, password } = req.body;
    const currentUser = await User.findOne({ id: req.user.id });
    if (currentUser.password !== password) return res.status(401).json({ message: "Bad Password" });

    const settings = await Setting.findOne();
    if (!settings.sectors.some(s => (typeof s === 'string' ? s : s.name) === department)) return res.status(404).json({ message: "Sector Decommissioned" });

    const hasAccess = await Request.findOne({ userId: currentUser.id, department, status: 'Approved', expiresAt: { $gt: new Date() } });
    
    const files = await FileModel.aggregate([
        { $match: hasAccess ? { department } : { owner: currentUser.username, department } },
        {
            $lookup: { from: "users", localField: "owner", foreignField: "username", as: "ownerData" }
        },
        {
            $addFields: { ownerName: { $arrayElemAt: ["$ownerData.fullName", 0] } }
        },
        { $project: { ownerData: 0 } }
    ]);

    res.json({ files, accessType: hasAccess ? 'ELEVATED' : 'STANDARD' });
});

app.post('/upload', securityLayer, (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err) return res.status(400).json({ message: err.message === 'SECURITY_BREACH_INVALID_FILE' ? "SECURITY BREACH: Invalid File Type" : err.message });
        next();
    });
}, async (req, res) => {
    const { department, passcode, status } = req.body;
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const u = await User.findOne({ id: req.user.id });
    if (passcode !== u.password) {
        fs.unlinkSync(req.file.path); 
        return res.status(401).json({ message: "Invalid Password" });
    }

    await FileModel.create({
        id: uuidv4(),
        filename: req.file.originalname,
        originalName: req.file.originalname,
        filePath: req.file.path,
        department, owner: u.username, status
    });

    await logEvent('INFO', u.username, `Uploaded secure payload: ${req.file.originalname}`);
    res.json({ message: "Uploaded" });
});

app.post('/delete-own-file', securityLayer, async (req, res) => {
    const u = await User.findOne({ id: req.user.id });
    const file = await FileModel.findOne({ id: req.body.id });
    
    if (!file) return res.status(404).json({message: "Not found"});
    if (file.owner !== u.username) return res.status(403).json({message: "Unauthorized"});

    if (fs.existsSync(file.filePath)) fs.unlinkSync(file.filePath);
    
    await FileModel.deleteOne({ id: req.body.id });
    await logEvent('WARN', u.username, `Incinerated File: ${file.filename}`);
    res.json({ message: "File Incinerated" });
});

app.post('/rename-file', securityLayer, async (req, res) => {
    const u = await User.findOne({ id: req.user.id });
    const file = await FileModel.findOne({ id: req.body.id });
    if (!file) return res.status(404).json({message: "Not found"});
    if (file.owner !== u.username) return res.status(403).json({message: "Unauthorized"});
    
    await FileModel.updateOne({ id: req.body.id }, { $set: { filename: req.body.newName }});
    await logEvent('INFO', u.username, `Renamed file to ${req.body.newName}`);
    res.json({ message: "Renamed" });
});

app.post('/request-access', securityLayer, async (req, res) => {
    const { department, duration, reason } = req.body;
    const u = await User.findOne({ id: req.user.id });
    await Request.create({ 
        id: uuidv4(), userId: u.id, username: u.username, department, 
        duration: parseInt(duration)||30, reason, status: 'Pending', requestedAt: new Date() 
    });
    res.json({ message: "Requested" });
});

app.post('/trap-trigger', async (req, res) => {
    const ip = req.body.ip || req.socket.remoteAddress;
    await Setting.updateOne({}, { $set: { lockdown: true } });
    await logEvent('ALERT', 'INTRUDER_CAUGHT', `Trap Triggered: ${ip}`);
    res.json({ status: "TRAPPED" });
});

// --- SECURE INLINE FILE VIEWER ROUTE ---
app.get('/view/:id', securityLayer, async (req, res) => {
    try {
        const file = await FileModel.findOne({ id: req.params.id });
        if (!file) return res.status(404).json({ message: "File not found" });

        if (!fs.existsSync(file.filePath)) return res.status(404).json({ message: "Physical file missing" });

        const u = await User.findOne({ id: req.user.id });
        await logEvent('INFO', u.username, `Securely Viewed file: ${file.originalName}`);

        res.sendFile(path.resolve(file.filePath));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error viewing file" });
    }
});

// --- DOWNLOAD FILE ROUTE ---
app.get('/download/:id', securityLayer, async (req, res) => {
    try {
        const file = await FileModel.findOne({ id: req.params.id });
        if (!file) return res.status(404).json({ message: "File not found in database" });

        if (!fs.existsSync(file.filePath)) return res.status(404).json({ message: "Physical file is missing or corrupted" });

        const u = await User.findOne({ id: req.user.id });
        await logEvent('INFO', u.username, `Downloaded file: ${file.originalName}`);

        res.download(file.filePath, file.originalName);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error downloading file" });
    }
});

// --- ADMIN ROUTES ---
app.get('/admin/data', securityLayer, async (req, res) => {
    if(req.user.role !== 'admin') return res.status(403);
    res.json({ 
        settings: await Setting.findOne(), files: await FileModel.find(), 
        requests: await Request.find().sort({ requestedAt: -1 }), logs: await Log.find().sort({ timestamp: -1 }).limit(100) 
    });
});
app.post('/admin/lockdown', securityLayer, async (req, res) => { 
    if(req.user.role!=='admin') return; 
    await Setting.updateOne({}, { $set: { lockdown: req.body.enabled }});
    await logEvent('ALERT', 'ADMIN', `LOCKDOWN ${req.body.enabled?'ON':'OFF'}`); 
    res.json({success:true}); 
});
app.post('/admin/approve-request', securityLayer, async (req, res) => { 
    if(req.user.role!=='admin') return; 
    const {requestId, action} = req.body; 
    const r = await Request.findOne({ id: requestId });
    if(r){
        r.status = action === 'Approve' ? 'Approved' : 'Denied';
        if(action === 'Approve') r.expiresAt = new Date(Date.now() + (r.duration || 30)*60000);
        await r.save();
    }
    res.json({success:true}); 
});
app.post('/admin/delete-file', securityLayer, async (req, res) => { 
    if(req.user.role!=='admin') return; 
    const file = await FileModel.findOne({ id: req.body.id });
    if(file && fs.existsSync(file.filePath)) fs.unlinkSync(file.filePath);
    await FileModel.deleteOne({ id: req.body.id }); 
    res.json({success:true}); 
});
app.post('/admin/add-sector', securityLayer, async (req, res) => { 
    if(req.user.role!=='admin') return; 
    await Setting.updateOne({}, { $push: { sectors: { name: req.body.name, level: req.body.level || 'Medium' } }});
    res.json({success:true}); 
});
app.post('/admin/delete-sector', securityLayer, async (req, res) => { 
    if(req.user.role!=='admin') return; 
    await Setting.updateOne({}, { $pull: { sectors: { name: req.body.name } }});
    res.json({success:true}); 
});
app.post('/admin/settings', securityLayer, async (req, res) => { 
    if(req.user.role!=='admin') return; 
    await Setting.updateOne({}, { $set: { allowedDomain: req.body.allowedDomain, idPattern: req.body.idPattern }});
    res.json({success:true}); 
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));