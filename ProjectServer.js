var express = require("express");
var mysql2 = require("mysql2");
var fileUploader = require("express-fileupload");
var cloudinary = require("cloudinary").v2;
var path = require("path");
var app = express();
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUploader()); 

app.listen(2007, function () {
    console.log("Server Started on port 2007");
});

app.get("/", function (req, resp) {
    let fullpath = path.join(__dirname, "public", "MainPage.html");
    resp.sendFile(fullpath);
});

let dbConfig = {
    host: "mysql-bce-goyalmanjali1-d7aa.i.aivencloud.com",
    user: "avnadmin",
    password: "AVNS_c2wNm-swQENNTNdNYe4",
    database: "defaultdb",
    port: 27835,
    ssl: { rejectUnauthorized: false }
};

// Create Connection
let mySqlServer = mysql2.createConnection(dbConfig);

mySqlServer.connect(function (err) {
    if (err) {
        console.log("Database Connection Error:", err.message);
    } else {
        console.log("Connected to DB");
    }
});

// Sign-up Route
app.get("/sign-save", function (req, resp) {
    let { signupEmail, signupPassword, selectUser } = req.query;

    let query = "INSERT INTO User (Email, pwd, usertype) VALUES (?, ?, ?)";

    mySqlServer.query(query, [signupEmail, signupPassword, selectUser], function (err) {
        if (err) {
            console.log("DB Insert Error:", err.message);
            resp.send("Error: " + err.message);
        } else {
            resp.send("Record Saved Successfully.");
        }
    });
});

// Login Route (Fixed)
app.get("/login-chk", function (req, resp) {
    let { email, password } = req.query; 

    let query = "SELECT pwd, usertype, statuss FROM User WHERE Email = ?";

    mySqlServer.query(query, [email], function (err, resultAry) {
        if (err) {
            console.error("DB Query Error:", err.message);
            return resp.status(500).send("Error: " + err.message);
        }

        if (resultAry.length === 0) {
            return resp.send("Invalid Email Id"); // Email not found in database
        }

        let storedPwd = resultAry[0].pwd;
        let userType = resultAry[0].usertype; // Retrieve user type
        let status = resultAry[0].statuss; // Check if user is blocked

        if (status === 1) {
            return resp.send("User Blocked"); // Blocked user cannot login
        }

        if (storedPwd === password) {
            resp.send(userType); // Send user type on successful login
        } else {
            resp.send("Invalid Password");
        }
    });
});

// Volunteer Registration Route
app.post("/vol", function (req, resp) {
    console.log("Received Volunteer KYC Data:", req.body);
    let fullpath = path.join(__dirname, "public", "VolKYC.html");
    resp.sendFile(fullpath);
});

// Cloudinary Configuration
cloudinary.config({
    cloud_name: 'dblnxpgyp', 
    api_key: '678419721831643', 
    api_secret: 'kFGtX8Akzj4UKq6ZV1FoNbxOO8k'
});

// Route to serve the registration form
app.get("/vol", function (req, resp) {
    let fullpath = path.join(__dirname, "public", "VolKYC.html");
    resp.sendFile(fullpath);
});

// Route to serve the client
app.get("/client", function (req, resp) {
    let fullpath = path.join(__dirname, "public", "client.html");
    resp.sendFile(fullpath);
});
const fs = require("fs");

// Volunteer Register
app.post("/Register-save", async function (req, resp) {
    try {
        if (!req.files || !req.files.profPic || !req.files.idPic) {
            return resp.status(400).send("Error: Profile picture and ID picture are required.");
        }
        let fileName = req.files.profPic.name;
        let fileName2 = req.files.idPic.name;

        let locationToSave1 = __dirname + "/public/uplodes/" + fileName;
        let locationToSave2 = __dirname + "/public/uplodes/" + fileName2;

        await req.files.profPic.mv(locationToSave1);
        await req.files.idPic.mv(locationToSave2);

        // Upload to Cloudinary
        let cloudProfPic = await cloudinary.uploader.upload(locationToSave1);
        let cloudIdPic = await cloudinary.uploader.upload(locationToSave2);

        let profPicUrl = cloudProfPic.secure_url;
        let idPicUrl = cloudIdPic.secure_url;

        let { a, b, c, d, e, f, g, h, i, j } = req.body;
        mySqlServer.query(
            "INSERT INTO volkyc (Email, name, contact, address, city, gender, dob, quali, occu, info, picpath, idpath) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [a, b, c, d, e, f, g, h, i, j, profPicUrl, idPicUrl],
            function (err) {
                if (err) {
                    console.log("DB Insert Error:", err.message);
                    return resp.status(500).send("Error: " + err.message);
                } else {
                    console.log("Record Saved Successfully!");
                    return resp.send("Record Saved Successfully.");
                }
            }
        );

    } catch (error) {
        console.error("Error:", error);
        return resp.status(500).send("Server Error: " + error.message);
    }
});

// Fetch Details
app.get("/Fetch-save",function(req,resp){
    mySqlServer.query("select *from volkyc where Email=?",[req.query.x], function(err,resultAry){
        resp.send(resultAry);
    })
})

// Update Details
app.post("/doUpdate",async function(req,resp)
{

    let emailID=req.body.emailID;
    let name=req.body.name;
    let contact=req.body.contact;
    let address=req.body.address;
    let city=req.body.city;
    let selectGender=req.body.selectGender;
    let date=req.body.date;
    let selectQualification=req.body.selectQualification;
    let selectOccupation=req.body.selectOccupation;
    let other=req.body.other;


    let fileName1="nopic.jpg";
    if(req.files!=null){
        fileName1=req.files.profPic.name;
        let locationToSave=__dirname+"/public/uplodes/"+fileName1;
        req.files.profPic.mv(locationToSave);
        try{
         await cloudinary.uploader.upload(locationToSave).then(function(picUrlResult){
            fileName1=picUrlResult.url;
            console.log(fileName1);
      });
    }catch(err){
        resp.send(err.message);
    }
    }

    let fileName2="nopic.jpg";
    if(req.files!=null) {
        fileName2=req.files.idPic.name;
        let locationToSave=__dirname+"/public/uplodes/"+fileName2;
        req.files.idPic.mv(locationToSave);
        try{
        await cloudinary.uploader.upload(locationToSave).then(function(picUrlResult){
            fileName2=picUrlResult.url;
            console.log(fileName2);
      });
    }catch(err){
        resp.send(err.message);
    }

    }

    mySqlServer.query("update volkyc set name=?,contact=?, address=? ,city=? ,gender=?,dob=?,quali=?,occu=?,info=?,picpath=? ,idpath=? where Email=?",
        [name,contact,address,city,selectGender,date,selectQualification,selectOccupation,other,fileName1,fileName2,emailID],function(err,result)
    {
            if(err==null)
            {
                if(result.affectedRows==1)
                    resp.send("Record Update Successsfulllyyy.. Badhaiiii");
                else
                    resp.send("Invalid Email ID");
            }
            else
            resp.send(err.message);
    })
        
   // resp.send("Hello");
})

// client-side -----> Register Data
app.get("/do-RegisterData",function (req, resp) {
    
        let { a, b, c, d, e, f, g, h, i, j } = req.query;
        mySqlServer.query(
            "INSERT INTO clients (ID, Name, Firm, BusProf, address, city, contact, idProof, idNum, other) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [a, b, c, d, e, f, g, h, i, j],
            function (err) {
                if (err) {
                    console.log("DB Insert Error:", err.message);
                    return resp.status(500).send("Error: " + err.message);
                } else {
                    console.log("Record Saved Successfully!");
                    return resp.send("Record Saved Successfully.");
                }
            }
        );
});

// Fetch Details
app.get("/Search-save",function(req,resp){
    mySqlServer.query("select *from clients where ID=?",[req.query.x], function(err,resultAry){
        resp.send(resultAry);
    })
})

// client dashboard
app.get("/client-dash",function(req,resp){
    let fullpath=__dirname+"/public/Client-dash.html";
    resp.sendFile(fullpath);
})

// Post Job
app.get("/do-Public", function (req, resp) {
    let { cEmail, ctitle, occu, address, city, selectId, contact } = req.query;

    mySqlServer.query(
        "INSERT INTO jobs (ClientID, JobTitle, JobType, FirmAddress, City, EducationRequired, ContactPerson) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [cEmail, ctitle, occu, address, city, selectId, contact], 
        function (err) {
            if (err) {
                console.log("DB Insert Error:", err.message);
                return resp.status(500).json({ error: err.message });
            } else {
                console.log("Job Published Successfully!");
                return resp.json({ success: "Job Published Successfully." });
            }
        }
    );
});

//------------- ANGULAR AJAX------------------

// Admin Dashboard
app.get("/all-records", function (req, resp) {
    mySqlServer.query("SELECT Email AS email, usertype, statuss FROM User", function (err, result) {
        if (err) {
            console.error("Database Query Error:", err.message);
            resp.status(500).send("Database Query Error: " + err.message);
            return;
        }
        console.log("Fetched Records:", result);
        resp.send(result);
    });
});

// Update Status
app.post("/update-status", function (req, resp) {
    let email = req.body.email;
    let newStatus = req.body.status; // Expecting 1 (Block) or 0 (Resume)

    let query = "UPDATE User SET statuss = ? WHERE Email = ?";
    mySqlServer.query(query, [newStatus, email], function (err, result) {
        if (err) {
            console.error("Update Error:", err.message);
            resp.status(500).send("Database Update Error: " + err.message);
            return;
        }
        console.log(`Updated status of ${email} to ${newStatus}`);
        resp.send({ success: true });
    });
});

// Client Manager
app.get("/getClients", function (req, resp) {
    let query = "SELECT ID, Name, Firm, BusProf, address, city, contact, idProof, idNum FROM clients";

    mySqlServer.query(query, function (err, result) {
        if (err) {
            console.error("Database Query Error:", err);
            return resp.status(500).json({ error: "Database query failed" });
        }
        console.log("Query Result:", result);
        resp.json(result);
    });
});

// Volunteer Manager
app.get("/getVolunteers", function (req, resp) {
    let query = "SELECT picpath, Email, name, contact, address, city, gender, dob, quali, occu FROM volkyc";

    mySqlServer.query(query, function (err, result) {
        if (err) {
            console.error("Database Query Error:", err);
            return resp.status(500).json({ error: "Database query failed" });
        }
        console.log("Query Result:", result);
        resp.json(result);
    });
});

// Filter Jobs
app.get("/getJobs",function(req,resp)
{
    console.log(req.query)
    if(req.query.emailKuch=="All")
        query="select * from jobs";
    else
        query="select * from jobs where ClientID=?";
    mySqlServer.query(query,[req.query.clientID],function(err,result)
    {
        console.log(result);
        resp.send(result);
    })
})

// Find Work
// Find Work----> Fetch City
app.get("/all-records-client-city", function (req, resp) {
    mySqlServer.query("SELECT DISTINCT City FROM jobs", function (err, result) {
        if (err) {
            console.error("Database Error: ", err);
            resp.status(500).send({ error: "Database query failed" });
            return;
        }
        resp.json(result);
    });
});

// Find Work----> Fetch Job Title
app.get("/all-records-job-title", function (req, resp) {
    mySqlServer.query("SELECT DISTINCT JobTitle FROM jobs", function (err, result) {
        if (err) {
            console.error("Database Error: ", err);
            resp.status(500).send({ error: "Database query failed" });
            return;
        }
        resp.json(result);
    });
});

// Find Work----> Fetch All Jobs
app.get("/all-related-job",function(req,resp)
{
    let city = req.query.city;
    let jobtitle = req.query.jobtitle; 
    let edu = req.query.edu;
        console.log("Received params:", city, jobtitle, edu); 
        mySqlServer.query("SELECT JobID, JobTitle, JobType, FirmAddress, ContactPerson FROM jobs WHERE City = ? AND JobTitle = ? AND EducationRequired = ?", 
            [city, jobtitle, edu], function (err, result) {
            if (err) {
                console.error("Database error:", err);
                return resp.status(500).send("Database error");
            }
            console.log("Query Result:", result); 
            resp.json(result); 
        });
})