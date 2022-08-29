const express = require('express');
const cors = require('cors');
const db = require('./config/connection.js');
require('dotenv').config();
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


const app = express();
app.use(express.static('view'))
app.use((req, res, next)=>{
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    // res.setHeader('Access-Control-Allow-Methods', '*');
    // res.setHeader('Access-Control-Allow-Credentials', 'true');
    next();
});

app.use(cors({
    origin: [' http://192.168.8.169:8080', 'http://localhost:8080'],
    credentials: true
 }));
// credentials will allow you to access the cookie on your fetch(url, 
{
credentials: 'include'
}

const router = express.Router();

const port = parseInt(process.env.PORT) || 3000;

app.use(router, cors(), express.json(), bodyParser.urlencoded({ extended: true }));

app.listen(port, ()=> {console.log(`Server is running on port ${port}`)});

// DISPLAY ALL ENDPOINTS
app.get('/',(req, res)=>{
    res.sendFile( "/view/endpoints.html", {root: __dirname})
})

//BOOKINGS

// DISPLAY ALL BOOKINGS
router.get('/bookings', (req, res)=>{
    const bookingsQ = `
        SELECT * FROM bookings
    `

    db.query(bookingsQ, (err, results)=>{
        if (err) throw err
        res.json({
            status: 200,
            bookings: results
        })
    })
})

// DISPLAY SINGLE BOOKING
router.get('/bookings/:id', (req, res)=>{
    const singleBookingQ = `
        SELECT * FROM bookings WHERE id = ${req.params.id}
    `

    db.query(singleBookingQ, (err, results)=>{
        if (err) throw err
        res.json({
            status: 200,
            bookings: results
        })
    })
})


// CREATE A BOOKING
router.post('/bookings', bodyParser.json(), (req, res)=>{
    let bd = req.body;
    const createBookingQ = `
        INSERT INTO bookings(prodName,prodDesc,prodPrice,prodImage,prodCategory,users_id)
        VALUES(?, ?, ?, ?, ?,?)
    `

    db.query(createBookingQ, [bd.prodName, bd.prodDesc, bd.prodPrice, bd.prodImage, bd.prodCategory, bd.users_id], (err,results)=>{
        if (err) throw err
        res.send('Your appointmennt has been booked')
    })
})


// DELETE BOOKING
router.delete('/bookings/:id', (req, res)=>{
    const deleteBookingQ = `
        DELETE FROM bookings WHERE id = ${req.params.id};
        ALTER TABLE bookings AUTO_INCREMENT = 1;
    `

    db.query(deleteBookingQ, (err, results)=>{
        if (err) throw err
        res.send('Your appointmennt has been cancelled')
    })
})

// EDIT BOOKING
router.put('/bookings/:id', bodyParser.json(), (req, res)=>{
    const editBookingQ = `
        UPDATE bookings
        SET prodName = ?, prodDesc = ?, prodPrice = ?, prodImage = ?, prodCategory= ?, users_id= ?
        WHERE id = ${req.params.id}
    `

    db.query(editBookingQ, [req.body.prodName, req.body.prodDesc, req.body.prodPrice, req.body.prodImage, req.body.prodCategory, req.body.users_id], (err, results)=>{
        if (err) throw err
        res.json({
            status: 200,
            results: 'The appointment has been edited succesfully'
        })
    })
})

//USERS

// REGISTER USER
router.post('/users', bodyParser.json(), async(req, res)=>{
    let bd = req.body
    const emailQ = `
        SELECT userEmail FROM users WHERE ?
    `
    let email = {
        userEmail: req.body.userEmail
    }

    db.query(emailQ, email, async(err, results)=>{
        if (err) throw err
        // VALIDATION
        if (results.length > 0) {
            res.json({
                status: 400,
                msg: "The provided email already exists. Please enter another one"
            })
        } else {
            let generateSalt = await bcrypt.genSalt(10);
            bd.userPassword = await bcrypt.hash(bd.userPassword, generateSalt);
            console.log(bd);
            // let date = {
            //     // date: new Date().toLocaleDateString(),
            //     date: new Date().toISOString().slice(0, 10)
            //   };
            // bd.join_date = date.date;

            const registerQ = `
                INSERT INTO users(userName, userSurname, userEmail, userPassword)
                VALUES(?, ?, ?, ? )
            `

            db.query(registerQ, [bd.userName, bd.userSurname, bd.userEmail, bd.userPassword], (err, results)=>{
                if (err) throw err
                const payload = {
                    user: {
                        userName: bd.userName,
                        userSurname: bd.userSurname,
                        userEmail: bd.userEmail,
                        userPassword: bd.userPassword
                    }
                };

                jwt.sign(payload, process.env.jwtSecret, {expiresIn: "365d"}, (err, token)=>{
                    if (err) throw err
                    res.json({
                        status: 200,
                        msg: 'Registration Successful',
                        token: token
                    })
                })
            })
        }
    })

})


// LOGIN USER
router.patch('/users', bodyParser.json(), (req, res)=>{
    const loginQ =`
        SELECT * FROM users WHERE ?
    `
    let user = {
        userEmail: req.body.userEmail
    };

    db.query(loginQ, user, async(err, results)=>{
        if (err) throw err

        if (results.length === 0) {
            res.json({
              status: 404,
              msg: 'Email Not Found. Please register'})
        } else {
            if (await bcrypt.compare(req.body.userPassword, results[0].userPassword) == false) {
                res.json({
                  status: 404,
                  msg: 'Password is Incorrect'})
            } else {
                const payload = {
                    user: {
                        userName: results[0].userName,
                        userSurname: results[0].userSurname,
                        userEmail: results[0].userEmail,
                        userPassword: results[0].userPassword
                    }
                };

                jwt.sign(payload, process.env.jwtSecret, {expiresIn: "365d"}, (err, token)=>{
                    if (err) throw err
                    res.json({
                        status: 200,
                        user: results,
                        token: token
                    })
                })
            }
        }
    })
})

// GET ALL USERS
router.get('/users', (req, res)=>{
    const allUsersQ = `
        SELECT * FROM users
    `

    db.query(allUsersQ, (err, results)=>{
        if (err) throw err
        res.json({
            status: 200,
            users: results
        })
    })
})

// GET SINGLE USER
router.get('/users/:id', (req, res)=>{
    const singleUserQ = `
        SELECT * FROM users WHERE id = ${req.params.id}
    `

    db.query(singleUserQ, (err, results)=>{
        if (err) throw err
        res.json({
            status: 200,
            user: results
        })
    })
})

// DELETE USER
router.delete('/users/:id', (req, res)=>{
    const deleteUserQ = `
        DELETE FROM users WHERE id = ${req.params.id};
        ALTER TABLE users AUTO_INCREMENT = 1;
    `

    db.query(deleteUserQ, (err, results)=>{
        if (err) throw err
        res.send('User Deleted')
    })
})

// EDIT USER
router.put('/users/:id', bodyParser.json(), (req, res)=>{
    const editUserQ = `
        UPDATE users
        SET userName = ?, userSurname = ?, userEmail = ?
        WHERE id = ${req.params.id}
    `

    db.query(editUserQ, [req.body.userName, req.body.userSurname, req.body.userEmail], (err, results)=>{
        if (err) throw err
        res.json({
            status: 200,
            results: 'The user has been successfully edited'
        })
    })

})

module.exports = {
    devServer: {
        Proxy: '*'
    }
}

