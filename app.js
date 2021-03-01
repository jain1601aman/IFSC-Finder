const mongoose = require('mongoose');
const path = require('path');
var converter = require('convert-excel-to-json');
var multer = require('fastify-multer')
var app = require('fastify')();
var xlsx = require('xlsx')
var events = require('events')


//db models
const bank_name = require('./bank.js');
const bankdetail = require('./bankdetail.js');
const authdetail = require('./password.js');
const localities = require('./location.js');
const states = require('./state.js');

//db connect
var url = "mongodb+srv://admin:admin4321@ifsc-finder.rvit9.mongodb.net/ifscDB";
mongoose.connect(url, {useNewUrlParser : true , useUnifiedTopology : true}).then(()=>{console.log('db connected')}).catch((e)=>{console.log(e.message)});

//event
const myevent = new events.EventEmitter();

// fastify set views
app.register(require('point-of-view'), {
    engine: {
      ejs: require('ejs')
    },
    templates: './views/',
    options: {}
  })

//parse form to json
app.register(require('fastify-formbody'))
app.register(multer.contentParser);
//check empty object
function isEmptyObject(obj) 
{
    return !Object.keys(obj).length;
}
var fname = ""

//file uploading
var assign = multer.diskStorage({
    destination : function(req,file,cb){
        
        return cb(null,'public/uploads');
    },
    filename : function(req,file,cb){
        fname = file.originalname;
        cb(null,file.originalname);
    }
})

var upload = multer({storage:assign,fileFilter: (req, file, cb) => {
    if (file.mimetype == "application/vnd.ms-excel" || file.mimetype == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
      cb(null, true);
    } else {
        
      cb(null, false);
      return cb((new Error('Only .xls or .xlsx format allowed!')).message);
      
      
    }
  }
});

//index page
app.get('/', function(req,res){
    res.view('index.ejs');
})

//add document
app.get('/add', function(req,res){
    res.view('add.ejs');
})

//search page
app.get('/search', function(req,res){
    res.view('search.ejs');
})

//search by IFSC/MICR page
app.post('/searching', function(req,res,next){
    // console.log(req.body.codetype);
    // console.log(req.body.code);
    if(req.body.codetype === 'ifsc')
    {
            var s = req.body.code.toUpperCase();
            bankdetail.find({IFSC:s},(err,user)=>{
            if(err) throw err;
            if (isEmptyObject(user)) {
                res.view('wrong.ejs');
              } else {
                res.view('result.ejs' ,{data : user[0]});
              }
        })

    }
    else
    {
        bankdetail.find({MICR:req.body.code},(err,user)=>{
            if(err) throw err;
            if (isEmptyObject(user)) {
                res.view('wrong.ejs')
              } else {
                res.view('result.ejs',{data : user[0]});
              }
        })
    }
})

//Document upload page
app.post('/submit' ,{preHandler : upload.single('excel')}, async function(req,res){
    var x = req.body.pass
    var name = req.body.bankname.toUpperCase();
    var micr = req.body.micr;
    const fpth = "./public/uploads/" + fname;
    var structure = {}
    if(micr=='y')
    {structure = {
        A:'Bank_Name',
        B:'IFSC',
        C:'MICR',
        D:'Branch_name',
        E:'Address',
        F:'city1',
        G:'city2',
        H:'state',
    }}
    else
    {
        structure = {
            A:'Bank_Name',
            B:'IFSC',
            C:'Branch_name',
            D:'Address',
            E:'city1',
            F:'city2',
            G:'state',
        }
    }
    /******************************get sheet name*********************************/

    var fls = xlsx.readFile(fpth);
    var snames = fls.SheetNames;
    var sheet = snames[0];
    /*****************************************************************************/

    await authdetail.find({password:x},(err,user)=>{
        if(err) throw err;
        if (isEmptyObject(user)) {
            res.view('wrong-pass.ejs')
          } else {
            bank_name.find({name:name},(err,user)=>{
                if(err) throw err;
                if ((isEmptyObject(user))) {
                    var bname = new bank_name();
                    bname.name = name;
                    bname.save();
                  }
            })
            
     const exceldata = converter({
        sourceFile :  fpth,
        sheets : [{
            name : sheet,
            header : {
                rows : 1
            },
            columnToKey : structure
        }]
        
    });
    
    var fdata = exceldata[Object.keys(exceldata)[0]];
    var locdata = new Array();
    var stat = new Array();
    fdata.forEach(function(element){
            element.city1 = element.city1.toUpperCase()
            element.state = element.state.toUpperCase()
        var x = {
            district : element.city1,
            state : element.state,
        }
        var y = {
            state : element.state
        }
        stat.push(y);
        locdata.push(x);
    })
    var jsonObject = locdata.map(JSON.stringify); 
    var uniqueSet = new Set(jsonObject); 
    locdata = Array.from(uniqueSet).map(JSON.parse);

    locdata.forEach(function(element){
        var y = element.district
        var x = element.state
        localities.find({district:y,state:x},(err,user)=>{
            if(err) throw err
            if (isEmptyObject(user)) {
                var loctemp = new localities();
                loctemp.state = x;
                loctemp.district = y;
                loctemp.save();
              }
        })
    })

    var uniquestate = new Set(stat.map(JSON.stringify));
    stat = Array.from(uniquestate).map(JSON.parse)
    stat.forEach(function(element){
        var x = element.state
        states.find({state:x},(err,user)=>{
            if(err) throw err
            if (isEmptyObject(user)) {
                var statetemp = new states();
                statetemp.state = x;
                statetemp.save();
              }
        })
    })
    bankdetail.insertMany(fdata);
     res.view('success.ejs',{count : fdata.length});
          }
    })
     
    
})

//bank by name search page
app.get('/banksearch' ,function(req,res){
    
    
    bank_name.find({},(err,user1)=>{
        if(err) throw err;
        res.view('banksearch.ejs' ,{records:user1});
    })
     
})

//display bank details page
app.post('/bankdetails' ,function(req,res){
    var name = req.body.bank;
    var state = req.body.state;
    bankdetail.find({'Bank_Name':name},(err,user)=>{
        if(err) throw err;
        res.view('bankdetails.ejs' ,{records:user,bank:name, empty:"NA"});
    })
    
})

// server
const start = async () => {
    try {
      await app.listen(3000)
    } catch (err) {
      app.log.error(err)
      process.exit(1)
    }
  }
  start()