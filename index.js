require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const router = express.Router();
const db = require("./conn/connection.js");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const port = parseInt(process.env.PORT) || 3000;

app.use((req, res, next) => {
  res.setHeader("mode", "no-cors");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Methods", "*");
  next();
});
app.use(
  cors({
    mode: "no-cors",
    origin: ["http://192.168.8.169:8080", "http://localhost:8080"],
    credentials: true,
  })
);

app.use(router, express.json(), express.urlencoded({ extended: true }));

app.use(express.static("views"));

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// DISPLAY ALL ENDPOINTS
app.get("/", (req, res) => {
  res.sendFile("/views/endpoints.html", { root: __dirname });
});

//BOOKINGS

// DISPLAY ALL BOOKINGS
router.get("/bookings", (req, res) => {
  const bookingsQ = `
        SELECT * FROM bookings
    `;

  db.query(bookingsQ, (err, results) => {
    if (err) throw err;
    res.json({
      status: 200,
      bookings: results,
    });
  });
});

// DISPLAY SINGLE BOOKING
router.get("/bookings/:id", (req, res) => {
  const singleBookingQ = `
        SELECT * FROM bookings WHERE id = ${req.params.id}
    `;

  db.query(singleBookingQ, (err, results) => {
    if (err) throw err;
    res.json({
      status: 200,
      bookings: results,
    });
  });
});

// CREATE A BOOKING
router.post("/bookings", bodyParser.json(), (req, res) => {
  let bd = req.body;
  const createBookingQ = `
        INSERT INTO bookings(prodName,prodDesc,prodPrice,prodImage,prodCategory)
        VALUES(?, ?, ?, ?, ?)
    `;

  db.query(
    createBookingQ,
    [
      bd.prodName,
      bd.prodDesc,
      bd.prodPrice,
      bd.prodImage,
      bd.prodCategory
    ],
    (err, results) => {
      if (err) throw err;
      res.send("Your appointmennt has been booked");
    }
  );
});

// DELETE BOOKING
router.delete("/bookings/:id", (req, res) => {
  const deleteBookingQ = `
        DELETE FROM bookings WHERE id = ${req.params.id};
        ALTER TABLE bookings AUTO_INCREMENT = 1;
    `;

  db.query(deleteBookingQ, (err, results) => {
    if (err) throw err;
    res.send("Your appointmennt has been cancelled");
  });
});

// EDIT BOOKING
router.put("/bookings/:id", bodyParser.json(), (req, res) => {
  const editBookingQ = `
        UPDATE bookings
        SET prodName = ?, prodDesc = ?, prodPrice = ?, prodImage = ?, prodCategory= ?
        WHERE id = ${req.params.id}
    `;

  db.query(
    editBookingQ,
    [
      req.body.prodName,
      req.body.prodDesc,
      req.body.prodPrice,
      req.body.prodImage,
      req.body.prodCategory
    ],
    (err, results) => {
      if (err) throw err;
      res.json({
        status: 200,
        results: "The appointment has been edited succesfully",
      });
    }
  );
});

//USERS

// REGISTER USER
router.post("/users", bodyParser.json(), async (req, res) => {
  let bd = req.body;
  const emailQ = `
        SELECT userEmail FROM users WHERE ?
    `;
  let email = {
    userEmail: req.body.userEmail,
  };

  db.query(emailQ, email, async (err, results) => {
    if (err) throw err;
    // VALIDATION
    if (results.length > 0) {
      res.json({
        status: 400,
        msg: "The provided email already exists. Please enter another one",
      });
    } else {
      let generateSalt = await bcrypt.genSalt(10);
      bd.userPassword = await bcrypt.hash(bd.userPassword, generateSalt);

      const registerQ = `
                INSERT INTO users(userName, userSurname, userEmail, userPassword)
                VALUES(?, ?, ?, ? )
            `;

      db.query(
        registerQ,
        [bd.userName, bd.userSurname, bd.userEmail, bd.userPassword],
        (err, results) => {
          if (err) throw err;
          const payload = {
            user: {
              userName: bd.userName,
              userSurname: bd.userSurname,
              userEmail: bd.userEmail,
              userPassword: bd.userPassword,
            },
          };
          jwt.sign(
            payload,
            process.env.jwtSecret,
            { expiresIn: "365d" },
            (err, token) => {
              if (err) throw err;
              res.json({
                status: 200,
                msg: "Registration Successful",
                user: results,
                token: token,
              });
            }
          );
        }
      );
    }
  });
});

// LOGIN USER
router.patch("/users", bodyParser.json(), (req, res) => {
  const loginQ = `
        SELECT * FROM users WHERE ?
    `;
  let user = {
    userEmail: req.body.userEmail,
  };
  db.query(loginQ, user, async (err, results) => {
    if (err) throw err;
    if (results.length === 0) {
      res.json({
        status: 404,
        msg: "Email Not Found. Please register",
      });
    } else {
      if (
          bcrypt.compare(
          req.body.userPassword,
          results[0].userPassword
        , (err, veri) =>{
            if (veri) {
                const payload = {
                    user: {
                      userName: results[0].userName,
                      userSurname: results[0].userSurname,
                      userEmail: results[0].userEmail,
                      userPassword: results[0].userPassword,
                    },
                  };
                  jwt.sign(
                    payload,
                    process.env.jwtSecret,
                    { expiresIn: "365d" },
                    (err, token) => {
                      if (err) throw err;
                      res.json({
                        status: 200,
                        user: results,
                        token: token,
                      });
                    }
                  );
            } else {
                res.json({
          status: 404,
          msg: "Password is Incorrect",
        });
         }
         })
  );
}})
})


// GET ALL USERS
router.get("/users", (req, res) => {
  const allUsersQ = `
        SELECT * FROM users
    `;

  db.query(allUsersQ, (err, results) => {
    if (err) throw err;
    res.json({
      status: 200,
      users: results,
    });
  });
});

// GET SINGLE USER
router.get("/users/:id", (req, res) => {
  const singleUserQ = `
        SELECT * FROM users WHERE id = ${req.params.id}
    `;

  db.query(singleUserQ, (err, results) => {
    if (err) throw err;
    res.json({
      status: 200,
      user: results,
    });
  });
});

// DELETE USER
router.delete("/users/:id", (req, res) => {
  const deleteUserQ = `
        DELETE FROM users WHERE id = ${req.params.id};
        ALTER TABLE users AUTO_INCREMENT = 1;
    `;

  db.query(deleteUserQ, (err, results) => {
    if (err) throw err;
    res.send("User Deleted");
  });
});

// EDIT USER
router.put("/users/:id", bodyParser.json(), (req, res) => {
  const editUserQ = `
        UPDATE users
        SET userName = ?, userSurname = ?, userEmail = ?
        WHERE id = ${req.params.id}
    `;

  db.query(
    editUserQ,
    [req.body.userName, req.body.userSurname, req.body.userEmail],
    (err, results) => {
      if (err) throw err;
      res.json({
        status: 200,
        results: "The user has been successfully edited",
      });
    }
  );
});

// CART
// GET CART PRODUCTS
router.get('/users/:id/cart', (req, res)=>{
  const cartQ = `
      SELECT cart FROM users 
      WHERE id = ${req.params.id}
  `

  db.query(cartQ, (err, results)=>{
      if (err) throw err

      if (results[0].cart !== null) {
          res.json({
              status: 200,
              cart: JSON.parse(results[0].cart)
          }) 
      } else {
          res.json({
              status: 404,
              message: 'There is no items in your cart'
          })
      }
  })
})


// ADD PRODUCT TO CART
router.post('/users/:id/cart', bodyParser.json(),(req, res)=>{
  let bd = req.body
  const cartQ = `
      SELECT cart FROM users 
      WHERE id = ${req.params.id}
  `

  db.query(cartQ, (err, results)=>{
      if (err) throw err
      if (results.length > 0) {
          let cart;
          if (results[0].cart == null) {
              cart = []
          } else {
              cart = JSON.parse(results[0].cart)
          }
          let booking = {
              "id" : cart.length + 1,
              "prodName" : bd.prodName,
              "prodCategory" : bd.prodCategory,
              "prodDesc" : bd.prodDesc,
              "prodImage" : bd.prodImage,
              "prodPrice" : bd.prodPrice
          }
          cart.push(booking);
          const query = `
              UPDATE users
              SET cart = ?
              WHERE id = ${req.params.id}
          `

          db.query(query , JSON.stringify(cart), (err, results)=>{
              if (err) throw err
              res.json({
                  status: 200,
                  results: 'Appointment booked'
              })
          })
      } else {
          res.json({
              status: 404,
              results: 'There is no user with that ID'
          })
      }
  })
})

// DELETE CART
router.delete('/users/:id/cart', (req,res)=>{
  const delCart = `
      SELECT cart FROM users 
      WHERE id = ${req.params.id}
  `
  db.query(delCart, (err,results)=>{
      if(err) throw err;
      if(results.length >0){
          const query = `
              UPDATE users 
              SET cart = null 
              WHERE id = ${req.params.id}
          `
          db.query(query,(err,results)=>{
              if(err) throw err
              res.json({
                  status:200,
                  results: `Your Appointment has been cancelled`
              })
          });
      }else{
          res.json({
              status:400,
              result: `There is no user with that ID`
          });
      }
  })
})

router.delete('/users/:id/cart/:cartId', (req,res)=>{
      const delSingleCartProd = `
          SELECT cart FROM users 
          WHERE id = ${req.params.id}
      `
      db.query(delSingleCartProd, (err,results)=>{
          if(err) throw err;

          if(results.length > 0){
              if(results[0].cart != null){

                  const result = JSON.parse(results[0].cart).filter((cart)=>{
                      return cart.cart_id != req.params.cartId;
                  })
                  result.forEach((cart,i) => {
                      cart.cart_id = i + 1
                  });
                  const query = `
                      UPDATE users 
                      SET cart = ? 
                      WHERE id = ${req.params.id}
                  `

                  db.query(query, [JSON.stringify(result)], (err,results)=>{
                      if(err) throw err;
                      res.json({
                          status:200,
                          result: "Your Appointment has been cancelled"
                      });
                  })

              }else{
                  res.json({
                      status:400,
                      result: "You have no Appointments booked"
                  })
              }
          }else{
              res.json({
                  status:400,
                  result: "There is no user with that id"
              });
          }
      })

})

module.exports = {
  devServer: {
    Proxy: "*",
  },
};
