/* eslint-disable no-irregular-whitespace */
const adminHelpers = require('../helpers/admin-helpers');
var userHelper = require('../helpers/user-helper');
const serviceSId = process.env.serviceSId;
const accountSSid = process.env.accountSSid;
const authId = process.env.authId;
const client = require('twilio')(accountSSid, authId);
const paypal = require('paypal-rest-sdk');
paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': process.env.PaypalClient_id,
    'client_secret': process.env.paypalClient_secret,
});
let errmessage;
let otperr;
let loginErr;
const verifylogin = (req, res, next) => {
    if (req.session.userLogin) {
        next();
    } else {
        res.redirect('/login');
    }
};

const paginatedResults = async(req, res, next)=> {   
    const page = parseInt(req.query.page); 
    const limit =6;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    console.log(page);
    console.log(startIndex);
    console.log(endIndex);
     
    const results = {};
    let productsCount=await userHelper.getProductsCount();
    if (endIndex < productsCount) {
      results.next = {
        page: page + 1,
        limit: limit
      };
    }
    
    if (startIndex > 0) {
      results.previous = {
        page: page - 1,
        limit: limit
      };
    }
    try {
      results.products = await userHelper.getPaginatedResult(limit,startIndex); 
      results.pageCount =Math.ceil(parseInt(productsCount)/parseInt(limit)).toString(); 
      results.pages =Array.from({length: results.pageCount}, (_, i) => i + 1);    
      results.currentPage =page.toString();
      res.paginatedResults = results;  
      next();
  
    } catch (e) {
      res.status(500).json({ message: e.message });
    } 
  };


let username = async (req, res) => {

    let cartCount = null;
    let wishlistCount = null;
    let userName = req.session.user;
    let products= await userHelper.getAllproductforUser();
    if (req.session.userLogin) {
        cartCount = await userHelper.getCartCount(req.session.user._id);
        wishlistCount = await userHelper.getwishlistCount(req.session.user._id);
       
        res.render('users/home', { cartCount, wishlistCount, userheader: true, login: true, userName,products });
    } else {
        res.render('users/home', { userheader: true,products });
    }
};
let signupPost = (req, res) => {
    userHelper.doSignUp(req.body).then((response) => {

        if (response.user) {
            res.redirect('/login');

        } else {
            errmessage = 'Email already exist';
            res.redirect('/signup');
        }
    });
};
let login = (req, res) => {
    if (req.session.user) {
        console.log('user login');
        res.redirect('/');
    } else {
        res.render('users/login', { loginErr });
        loginErr = '';
    }
};
let signupGet = (req, res) => {
    if (req.session.user) {
        res.redirect('/');

    } else {
        res.render('users/signup', { errmessage });
        errmessage = '';
    }
};
let loginPost = (req, res) => {
    userHelper.doLogin(req.body).then((response) => {
        if (response.status) {

            req.session.user = response.user;
            req.session.userLogin = true;

            res.redirect('/');

        } else {
            loginErr = 'user details not valid';
            res.redirect('/login');
        }
    });
};

let loginOtp = (req, res) => {
    req.session.mobile = req.body.number;
    userHelper.mobileOtp(req.body).then((response) => {
        req.session.user = response.user;
        client.verify
            .services(serviceSId)
            .verifications.create({
                to: `+91${req.session.mobile}`,
                channel: 'sms'

            }).then((response) => {
                req.session.user = response.user;
                req.session.userloginErr = false;

            }).catch((err) => {
                console.log(err);

            });
        res.redirect('/getotp');
    }).catch((err) => {
        console.log(err);
        req.session.err = err;
    });

};

let otp = (req, res) => {
    res.render('users/phoneNumber');
};
let getOtp = (req, res) => {
    res.render('users/getotp', { otperr });
    otperr = '';


};

let postOtp = (req, res) => {

    const { otp } = req.body;

    const mob = req.session.mobile;
    client.verify
        .services(serviceSId)
        .verificationChecks.create({
            to: `+91${mob}`,
            code: otp
        }).then((response) => {
            if (response.valid) {
                req.session.userLogin = true;
                res.redirect('/');
            } else {
                otperr = 'enter valid Otp';
                req.session.user = null;
                res.redirect('/getotp');

            }
        });
};
let logOut = (req, res) => {
    req.session.userLogin = false;
    req.session.user = null;
    res.redirect('/login');
};

// let product = async (req, res) => {
//     let cartCount = null;
//     let wishlistCount = null;
//     let userName = req.session.user;
//     if (req.session.userLogin) {
//         cartCount = await userHelper.getCartCount(req.session.user._id);
//         wishlistCount = await userHelper.getwishlistCount(req.session.user._id);
//     }
//     adminHelpers.getAllproducts().then((products) => {
//         userHelper.getCategory().then((brands) => {
//             console.log(brands);
//             res.render('users/product', { userheader: true, products, login: true, cartCount, userName, wishlistCount, brands });
//         });
//     });
// };

let product = async(req, res) => {
  
    let products =res.paginatedResults.products;
    let next =res.paginatedResults.next;
    let previous=res.paginatedResults.previous;
    let pages =res.paginatedResults.pages;
    let pageCount =res.paginatedResults.pageCount;
    let currentPage =res.paginatedResults.currentPage;
     console.log(products,'prooooooooooooooooo');
  
    if (req.session.userLogin) {
     
         let categories = await adminHelpers.getCategory();
         
         
         let userName = req.session.user;
        
         let cartCount = await userHelper.getCartCount(req.session.user._id);
         let wishlistCount = await userHelper.getwishlistCount(req.session.user._id);
        let brands = await userHelper.getCategory();
          res.render('users/product', { userheader: true, products, login: true, cartCount, userName, wishlistCount, brands,categories,next,previous,pages,pageCount,currentPage});
      
     
    } else {
        let brands = await userHelper.getCategory();
        let categories = await adminHelpers.getCategory();
          
          res.render('users/product', { userheader: true, products,categories,next,previous,pages,pageCount,currentPage,brands });
      
      
    }
  };


let productview = (req, res) => {
    let productId = req.params.id;
    let userName = req.session.user;
    
    adminHelpers.productView(productId).then(async(product) => {
        let products= await userHelper.getAllproductforUser();
        res.render('users/product-view', { userheader: true, product, login: true, userName,products });

    });

};
let cart = async (req, res) => {
    let userName = req.session.user;
    let cartCount = await userHelper.getCartCount(req.session.user._id);
    let wishlistCount = await userHelper.getwishlistCount(req.session.user._id);
    if (cartCount) {
        let products = await userHelper.getCartProducts(req.session.user._id);
        let totalValue = await userHelper.getTotalAmount(req.session.user._id);

        res.render('users/cart', { user: req.session.user._id, products, userheader: true, login: true, cartCount, totalValue, userName, wishlistCount });

    } else {
        
          let cartCountFalse=true;
        res.render('users/cart', { userheader: true, login: true, cartCount, userName, wishlistCount,cartCountFalse });
    }
};
let addToCart = (req, res) => {
    const { id } = req.params;
    if(req.session.userLogin){
        userHelper.addToCart(id, req.session.user._id).then(() => {
            res.redirect('/product');
        });

    }else{
        res.redirect('/login');
    }
};
let changeProductsQuantity = (req, res) => {
    userHelper.changeProductQuantity(req.body).then(async (response) => {
        response.total = await userHelper.getTotalAmount(req.body.user);

        res.json(response);

    });
};
let checkout = async (req, res) => {
    let userName = req.session.user;
    let cartCount = await userHelper.getCartCount(req.session.user._id);
    let wishlistCount = await userHelper.getwishlistCount(req.session.user._id);
    if (cartCount) {
        let products = await userHelper.getCartProducts(req.session.user._id);
        let total = await userHelper.getTotalAmount(req.session.user._id);
        let userId = req.session.user._id;
        userHelper.getuseraddress().then((address) => {
            res.render('users/checkout', { total, products, userheader: true, login: true, userId, cartCount, address, userName, wishlistCount });

        });


    } else {
        res.redirect('/product');

    }

};
let placeOrder = async (req, res) => {
    let totalPrice = parseInt(req.query.total);   
    let products = await userHelper.getCartProductList(req.body.userId);

    userHelper.saveAddressOfUser(req.body);
    userHelper.placeOrder(req.body, products, totalPrice).then((orderId) => {
        let response = {};
        if (req.body['paymentMethod'] === 'COD') {
            response.cod = true;
            res.json(response);
        } else if (req.body['paymentMethod'] == 'ONLINE') {
            userHelper.generateRazorpay(orderId, totalPrice).then((resp) => {
                response.razorpay = true;
                response.order = resp;
                res.json(response);
            });
        } else if (req.body['paymentMethod'] == 'PAYPAL') {
            res.json({ paypal: true });
        } else {
            res.redirect('/cart');
        }
    });
};
let order = async (req, res) => {
    let userName = req.session.user;
    let products = await userHelper.getCartProducts(req.session.user._id);
    let orders = await userHelper.getUserOrder(req.session.user._id);
    let cartCount = await userHelper.getCartCount(req.session.user._id);
    let wishlistCount = await userHelper.getwishlistCount(req.session.user._id);
    console.log(orders);
    res.render('users/order', { userheader: true, login: true, user: req.session.user, orders, cartCount, userName, wishlistCount,products });
};

let removeCart = (req, res) => {
    userHelper.removeCartItem(req.body).then((response) => {
        res.json(response);
    });
};
let orderDetails = (req, res) => {
    let userName = req.session.user;
    userHelper.getUserOrderProducts(req.params.id).then(async (orders) => {
        let cartCount = await userHelper.getCartCount(req.session.user._id);
        let wishlistCount = await userHelper.getwishlistCount(req.session.user._id);
        console.log(orders);
        orders.forEach(element => {

            if (element.status === 'Delivered') {
              element.delivered = true;
            } else {
              element.delivered = false;
            }
      
            if (element.status === 'cancelled') {
              element.cancelled = true;
            } else {
              element.cancelled = false;
            }
      
            if (element.status === 'Return-requested') {
              element.returnRequest = true;
            } else {
              element.returnRequest = false;
            }
      
            if (element.status === 'return-Approved') {
              element.returnApproved = true;
            } else {
              element.returnApproved = false;
            }
      
      
          });
      


        res.render('users/orderDetails', { userheader: true, login: true, orders, cartCount, userName, wishlistCount });
    });
};
let cancelorder = (req, res) => {
    userHelper.cancelOrder(req.params.id);
    res.redirect('/order');
};
let cancelorderStatus = (req,res) => {
    console.log(req.query);
    console.log('jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj');
    userHelper.cancelorderStatus(req.query).then(() => {
        res.redirect('/orderDetails/' + req.query.orderid);


    });

};
let verifyPayment = (req, res) => {
    userHelper.verifyPayment(req.body).then(() => {
        userHelper.changePaymentStaus(req.body['order[receipt]']).then(() => {
            console.log('payment success');
            res.json({ status: true });
        });
    }).catch((err) => {
        console.log(err);
        res.json({ status: false, errMsg: '' });
    });
};
let pay = (req, res) => {
    const create_payment_json = {
        'intent': 'sale',
        'payer': {
            'payment_method': 'paypal'
        },
        'redirect_urls': {
            'return_url': 'http://localhost:3000/success',
            'cancel_url': 'http://localhost:3000/cancel'
        },
        'transactions': [{
            'item_list': {
                'items': [{
                    'name': 'Red Sox Hat',
                    'sku': '001',
                    'price': '5.00',
                    'currency': 'USD',
                    'quantity': 1
                }]
            },
            'amount': {
                'currency': 'USD',
                'total': '5.00'
            },
            'description': 'Hat for the best team ever'
        }]
    };

    paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
            throw error;
        } else {
            for (let i = 0; i < payment.links.length; i++) {
                if (payment.links[i].rel === 'approval_url') {
                    res.json(payment.links[i].href);
                }
            }
        }
    });

};
let success = (req, res) => {
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;
    const execute_payment_json = {
        'payer_id': payerId,
        'transactions': [{
            'amount': {
                'currency': 'USD',
                'total': '5.00'
            }
        }]
    };

    paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
        if (error) {
            console.log(error.response);
            throw error;
        } else {
            console.log(JSON.stringify(payment));
            res.redirect('/order');
        }
    });
};
let cancel = (req, res) => res.send('Cancelled');
let selectedAddress = (req, res) => {
    try {
        userHelper.getaddress(req.body.addressId).then((selectedAddress) => {
            res.json(selectedAddress);

        });
    } catch (e) {
        console.log(e);
    }
};
// let account = async (req, res) => {
//     let userName = req.session.user;
//     let cartCount = await userHelper.getCartCount(req.session.user._id);
//     let wishlistCount = await userHelper.getwishlistCount(req.session.user._id);
//     res.render('users/account', { userheader: true, login: true, cartCount, userName, wishlistCount });
// };
let profile = async (req, res) => {

    res.redirect('/wallet');

};
let saveChanges = (req, res) => {
    let useriD = req.session.user._id;
    userHelper.updateUsersDetails(useriD, req.body).then(() => {
        res.redirect('/profile');
    });
};
let checkCoupen = async (req, res) => {
    let useriD = req.session.user._id;
    let totalValue = await userHelper.getTotalAmount(req.session.user._id);
    userHelper.checkCoupen(useriD, req.body.coupon, totalValue).then((response) => {
        res.json(response);

    });
};
let wishlist = async (req, res) => {
    let userName = req.session.user;
    let cartCount = await userHelper.getCartCount(req.session.user._id);
    let wishlistCount = await userHelper.getwishlistCount(req.session.user._id);
    let products = await userHelper.getwishlistProducts(req.session.user._id);
    if (wishlistCount) {
        
        res.render('users/wishlist', { userheader: true, login: true, wishlistCount, cartCount, userName, products });
    }else{
        let wishlistfale=true;
        res.render('users/wishlist', { userheader: true, login: true, wishlistCount, cartCount, userName,wishlistfale});
    }
};
let addToWishlis = (req, res) => {
    let useriD = req.session.user._id;
    let ProID = req.params.id;
    userHelper.addToWishlist(useriD, ProID);
    res.redirect('/product');


};
let removeWishlist = (req, res) => {
    userHelper.removeWishlistItem(req.body).then((response) => {
        res.json(response);



    });
};
let wishlistToCart = (req, res) => {
    const { id } = req.params;
    userHelper.addToCart(id, req.session.user._id).then(() => {

        res.redirect('/product');
    });


};
let filter = async (req, res) => {
    let userName = req.session.user;
    let cartCount = await userHelper.getCartCount(req.session.user._id);
    let wishlistCount = await userHelper.getwishlistCount(req.session.user._id);
    let products = await userHelper.getwishlistProducts(req.session.user._id);
    let filterProducts = null;
    let brandFilter = null;
    if (req.query.brandName) {
        brandFilter = (Array.isArray(req.query.brandName)) ? req.query.brandName : Object.values(req.query);
        filterProducts = await userHelper.getFilterProducts(brandFilter);

    }
    userHelper.getCategory().then(async (brands) => {

        res.render('users/filtter', { userheader: true, login: true, wishlistCount, cartCount, userName, products, filterProducts, brandFilter, brands });
    });
};
let editAddress = async (req, res) => {
    let userName = req.session.user;
    let cartCount = await userHelper.getCartCount(req.session.user._id);
    let wishlistCount = await userHelper.getwishlistCount(req.session.user._id);
    let products = await userHelper.getwishlistProducts(req.session.user._id);
    userHelper.getaddressForEdit().then((address) => {
        res.render('users/editAdress', { userheader: true, login: true, wishlistCount, cartCount, userName, products, address });
    });

};
let editaddressPost = (req, res) => {
    userHelper.updateaddress(req.body.addressId, req.body).then(() => {
        res.redirect('/editAddress');
    });
};

let wallet =async(req,res)=>{
    let userName = req.session.user;
    let cartCount = await userHelper.getCartCount(req.session.user._id);
    let wishlistCount = await userHelper.getwishlistCount(req.session.user._id);
    let products = await userHelper.getwishlistProducts(req.session.user._id);
    let  userDetails = await userHelper.getProfile( req.session.user._id);
    res.render('users/wallet', { userheader: true, login: true, wishlistCount, cartCount, userName, products,userDetails});
};

let walletOg =async(req,res)=>{
    let userName = req.session.user;
    let cartCount = await userHelper.getCartCount(req.session.user._id);
    let wishlistCount = await userHelper.getwishlistCount(req.session.user._id);
    let products = await userHelper.getwishlistProducts(req.session.user._id);
    let  userDetails = await userHelper.getProfile( req.session.user._id);
    let wallet = await userHelper.getWalletAmount(req.session.user._id);
    res.render('users/walletOg', { userheader: true, login: true, wishlistCount, cartCount, userName, products,userDetails,wallet});
};

let returnProduct=async(req,res)=>{
    let userName = req.session.user;
    let cartCount = await userHelper.getCartCount(req.session.user._id);
    let wishlistCount = await userHelper.getwishlistCount(req.session.user._id);
    let products = await userHelper.getwishlistProducts(req.session.user._id);
    let  userDetails = await userHelper.getProfile( req.session.user._id);
    let wallet = await userHelper.getWalletAmount(req.session.user._id);
    console.log(req.query);

    let orderId =  req.query.orderid;
    let productId = req.query.proId;
    let userId = req.session.user._id;
    userHelper.getReturnproducts(orderId, productId).then((returnedProduct) => {
        userHelper.updateShippingStatus(orderId, productId);  
    

        console.log(returnedProduct);
  
        res.render('users/return', { userheader: true, login: true, wishlistCount, cartCount, userName, products,userDetails,wallet,returnedProduct,userId});
       
    });

    
};

let returnP=(req, res) => {
    console.log(req.body);
    userHelper.ReturnproductCollectionCreation(req.body).then(() => {
        res.redirect('/order');
    });

};

let changePassword=(req,res)=>{
    console.log(req.body);
     let p = req.body.CPass;
     let np =req.body.Npass;
     let userId = req.session.user._id;
    userHelper.changePassword(p,np,userId).then((response)=>{
        res.json(response);

    });


};
let searchProducts=(req,res)=>{

    try{

        let payload=req.body.payload.trim();
        userHelper.getSearchedProducts(payload).then((search)=>{
           res.json({payload:search});
        });
      }catch(e){
        console.log(e);
       
      }
      
};

module.exports = {
    username,
    signupPost,
    login,
    signupGet,
    loginPost,
    otp,
    loginOtp,
    getOtp,
    postOtp,
    logOut,
    product,
    productview,
    cart,
    addToCart,
    changeProductsQuantity,
    checkout,
    placeOrder,
    order,
    removeCart,
    orderDetails,
    cancelorder,
    cancelorderStatus,
    verifyPayment,
    pay,
    success,
    cancel,
    selectedAddress,
    profile,
    saveChanges,
    checkCoupen,
    wishlist,
    addToWishlis,
    removeWishlist,
    wishlistToCart,
    filter,
    editAddress,
    editaddressPost,
    verifylogin,
    wallet,
    walletOg,
    paginatedResults,
    returnProduct,
    returnP,
    changePassword,
    searchProducts
};