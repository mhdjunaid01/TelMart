/* eslint-disable no-unused-vars */
/* eslint-disable no-async-promise-executor */
/* eslint-disable no-irregular-whitespace */
var db = require('../config/connection');
var collection = require('../config/collections');
var bcrypt = require('bcrypt');
var objectId = require('mongodb').ObjectId;
const Razorpay = require('razorpay');
const { resolve } = require('path');
var voucher_codes = require('voucher-code-generator');
const { response } = require('../app');
require('dotenv').config();

var instance = new Razorpay({
    key_id: process.env.key_id,
    key_secret: process.env.key_secret
});

module.exports = {
    doSignUp: (userData) => {
        let telle;
        let userdata = userData.number;
        telle = parseInt(userdata);
        userData.number = telle;
        userData.signupstatus = true;

        return new Promise(async (resolve, reject) => {


            let response = {};
            userData.password = await bcrypt.hash(userData.password, 10);
            let userfind = await db.get().collection('userDetails').findOne({ email: userData.email });
            if (userfind) {
                response.user = false;
                response.errmessage = 'email already exist';
                resolve(response);
            } else {
                let refferal = voucher_codes.generate({
                    prefix: 'TELMA-',
                    postfix: '-2022'
                });


                userData.refferal = refferal[0];

                if (userData.refferalcode) {

                    let findCode = await db.get().collection(collection.USER_COLLECTION).findOne({ refferal: userData.refferalcode });

                    let walletObj = {
                        userId: findCode._id,
                        refferalcode: userData.refferalcode,
                        walletAmount: 50,

                    };




                    if (findCode) {
                        let findWallet = await db.get().collection(collection.WALLET_COLLECTION).findOne({ userId: findCode._id });
                        console.log(findWallet);
                        if (findWallet) {
                            db.get().collection(collection.WALLET_COLLECTION).updateOne({ userId: findCode._id },
                                {
                                    $set: { walletAmount: findWallet.walletAmount + 50 }
                                },
                            );

                        } else {
                            db.get().collection(collection.WALLET_COLLECTION).insertOne(walletObj);
                        }


                    }
                }


                db.get().collection('userDetails').insertOne(userData).then(async () => {
                    if (userData.refferalcode != '' || userData.refferalcode != null) {
                        let findCode = await db.get().collection(collection.USER_COLLECTION).findOne({ refferal: userData.refferalcode });
                        if (findCode) {
                            let walletObj = {
                                userId: userData._id,
                                walletAmount: 50,

                            };

                            db.get().collection(collection.WALLET_COLLECTION).insertOne(walletObj);
                        }


                    }
                    response.user = true;
                    resolve(response);
                }).catch((error) => {
                    reject(error);
                });
            }
        });
    },
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {

            let response = {};
            let userfind = await db.get().collection(collection.USER_COLLECTION).findOne({ $and: [{ email: userData.email, signupstatus: true }] });
            console.log(userfind);
            if (userfind) {
                bcrypt.compare(userData.password, userfind.password).then((status) => {
                    if (status) {
                        console.log('success');
                        response.user = userfind;
                        response.status = true;
                        resolve(response);
                    } else {
                        console.log('password mismatch');
                        response.status = false;
                        resolve(response);
                    }
                }).catch((error) => {
                    reject(error);
                });
            } else {
                console.log('Email not found in the database');
                response.status = false;
                resolve(response);
            }
        });
    },
    mobileOtp: (userData) => {
        let response = {};
        let telle;
        return new Promise(async (resolve, reject) => {
            let userdata = userData.number;
            telle = parseInt(userdata);
            userData.number = telle;
            let mob = userData.number;

            let user = await db.get().collection('userDetails').findOne({ number: mob });
            if (user) {
                response.user = user;
                resolve(response);
            }
            else {
                reject('ERROR');
            }
        });
    },
    addToCart: (proId, userId) => {
        return new Promise(async (resolve, reject) => {
            let proObj = {
                item: objectId(proId),
                quantity: 1
            };
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) });

            if (userCart) {

                let proExist = userCart.products.findIndex(product => product.item == proId);
                if (proExist != -1) {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: objectId(userId), 'products.item': objectId(proId) },
                            {
                                $inc: { 'products.$.quantity': 1 }
                            }
                        ).then(() => {
                            resolve();
                        }).catch((error) => {
                            reject(error);
                        });

                } else {


                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId) },
                        {
                            $push: { products: proObj }
                        }
                    ).then(() => {
                        resolve();
                    });

                }

            } else {
                let cartObj = {
                    user: objectId(userId),
                    products: [proObj]
                };
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then(() => {
                    resolve();
                });
            }
        });
    },


    getProductsCount: () => {
        return new Promise(async (resolve, _reject) => {
            let count = await db.get().collection(collection.PRODUCT_COLLECTION).find().count();
            resolve(count);
        });
    },


    getPaginatedResult: (limit, skip) => {

        return new Promise(async (resolve, reject) => {
            try {
                let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().limit(limit).skip(skip).toArray();

                resolve(products);
            }
            catch (err) {
                let error = {};
                error.message = 'Something went wrong';
                reject(error);
            }

        });
    },

    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'

                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }


            ]).toArray();
            resolve(cartItems);
        });
    },

    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0;
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) });
            if (cart) {
                count = cart.products.length;
            }
            resolve(count);
        });
    },

    changeProductQuantity: (details) => {
        details.count = parseInt(details.count);
        details.quantity = parseInt(details.quantity);

        return new Promise((resolve, reject) => {
            if (details.count == -1 && details.quantity == 1) {

                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(details.cart) },
                        {
                            $pull: { products: { item: objectId(details.product) } }
                        }
                    ).then(() => {
                        resolve({ removeProduct: true });
                    }).catch((error) => {
                        reject(error);
                    });
            } else {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(details.cart), 'products.item': objectId(details.product) },
                        {
                            $inc: { 'products.$.quantity': details.count }
                        }
                    ).then(() => {
                        resolve({ status: true });
                    }).catch((error) => {
                        reject(error);
                    });
            }
        });
    },
    getTotalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) });
            if (cart.products[0]) {
                let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                    {
                        $match: { user: objectId(userId) }
                    },
                    {
                        $unwind: '$products'
                    },
                    {
                        $project: {
                            item: '$products.item',
                            quantity: '$products.quantity'

                        }
                    },
                    {
                        $lookup: {
                            from: collection.PRODUCT_COLLECTION,
                            localField: 'item',
                            foreignField: '_id',
                            as: 'product'
                        }
                    },
                    {
                        $project: {
                            item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: { $multiply: ['$quantity', '$product.price'] } }
                        }
                    },
                    {
                        $project: {
                            total: 1
                        }
                    }
                ]).toArray();
                resolve(total[0].total);
            } else {
                resolve();
            }

        });


    },

    placeOrder: (order, products, total) => {
        return new Promise((resolve, reject) => {

            console.log(products);
            console.log('order of the user when place order');
            // 👇️ args are yyyy, mm, dd
            let date = new Date();

            function padTo2Digits(num) {
                return num.toString().padStart(2, '0');
            }

            const year = date.getFullYear();
            const month = padTo2Digits(date.getMonth() + 1);
            const day = padTo2Digits(date.getDate());


            let dateOforder = [year, month, day].join('-');
            let mOforder = [year, month].join('-');

            let yOforder = [year].join('-');


            let response = {};
            if (products == 0 && total == 0) {
                response.status = false;
                resolve(response);
            } else {
                let status = order.paymentMethod === 'COD' ? 'placed' : 'pending';
                let ordrStatus = 'confirmed';

                let orderObj = {
                    deleveryDetails: {
                        firstname: order.firstname,
                        lastname: order.lastname,
                        mobile: order.mobile,

                        address: {
                            pincode: order.pincode,
                            city: order.city,
                            streetname: order.streetname,
                            state: order.state,
                            country: order.country

                        },
                        email: order.email

                    },
                    userId: objectId(order.userId),
                    paymentMethod: order.paymentMethod,
                    products: products,

                    productLoop: products.forEach((obj) => {
                        obj.orderStatus = ordrStatus;
                    }),

                    totalAmount: total,
                    status: status,
                    date: dateOforder,
                    month: mOforder,
                    year: yOforder,

                };

                db.get().collection(collection.ORDER_COLLECRTION).insertOne(orderObj).then((response) => {
                    db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(order.userId) }).then(() => {
                        response.status = true;
                        resolve(response.insertedId);


                    });

                });


            }
        });

    },
    getCartProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) });
            resolve(cart.products);

        });

    },
    getUserOrder: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let orders = await db.get().collection(collection.ORDER_COLLECRTION).find({ userId: objectId(userId) }).sort({ '_id': -1 }).toArray();
                resolve(orders);

            } catch (error) {
                reject(error);

            }

        });

    },
    getUserOrderProducts: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let orderItem = await db.get().collection(collection.ORDER_COLLECRTION).aggregate([
                {
                    $match: { _id: objectId(orderId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',
                        status: '$products.orderStatus',
                        cancel: '$products.orderCancelled',


                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }, status: 1, cancel: 1
                    }
                },

            ]).toArray();
            resolve(orderItem);
        });

    },
    removeCartItem: ({ cart, product }) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(cart) }, { $pull: { 'products': { item: objectId(product) } } }).then((data) => {

                resolve(data);
            }).catch((error) => {
                reject(error);
            });
        });
    },
    cancelOrder: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let order = await db.get().collection(collection.ORDER_COLLECRTION).updateOne({ _id: objectId(orderId) },
                {
                    $set: { status: 'cancelled', orderCancelled: true }
                }, { upsert: true }
            );
            resolve(order);
        });
    },
    generateRazorpay: (orderId, totalPrice) => {
        return new Promise((resolve, reject) => {
            try {
                var options = {
                    amount: totalPrice * 100,  // amount in the smallest currency unit
                    currency: 'INR',
                    receipt: '' + orderId
                };
                instance.orders.create(options, function (err, order) {
                    if (err) {
                        console.log(err);
                    } else {
                        resolve(order);
                    }
                });

            } catch (error) {
                reject(error);
            }
        });
    },

    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            const crypto = require('crypto');
            let hmac = crypto.createHmac('sha256', 'YCwPGx0vo5s4okl3nSXmfcsv');
            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]']);
            hmac = hmac.digest('hex');
            if (hmac == details['payment[razorpay_signature]']) {
                resolve();
            } else {
                reject();
            }

        });
    },

    changePaymentStaus: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECRTION)
                .updateOne({ _id: objectId(orderId) },
                    {
                        $set: {
                            status: 'placed'
                        }
                    }
                ).then(() => {
                    resolve();
                }).catch((error) => {
                    reject(error);
                });

        });
    },

    gettingSelectedAddress: (customerdetails, userid) => {
        let customerName = customerdetails.customerName;
        let customeraddress = customerdetails.customeraddress;


        return new Promise((resolve, reject) => {
            db.get().collection(collection.ADDRESS_COLLECTION).aggregate([
                {
                    $match: {

                        $and: [
                            { userId: objectId(userid) },
                            { 'address.first': customerName },
                            { 'address.houseAddress.streetaddress': customeraddress }
                        ]
                    },

                },
            ]).toArray().then((response) => {

                resolve(response);
            }).catch((error) => {
                reject(error);
            });
        });


    },

    saveAddressOfUser: (address) => {
        console.log(address);
        db.get().collection(collection.ADDRESS_COLLECTION).findOne(address).then((findAddress) => {
            if (!findAddress) {
                db.get().collection(collection.ADDRESS_COLLECTION).insertOne(address).then(() => {
                    resolve();
                });
            }
        });
    },
    getuseraddress: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ADDRESS_COLLECTION).find().toArray().then((address) => {
                resolve(address);
            }).catch((error) => {
                reject(error);
            });


        });

    },

    getaddress: (addressId) => {

        return new Promise((resolve, reject) => {
            db.get().collection(collection.ADDRESS_COLLECTION).findOne({ _id: objectId(addressId) }).then((selectedAddress) => {
                resolve(selectedAddress);
            }).catch((error) => {
                reject(error);
            });

        });
    },

    getProfile: (useriD) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(useriD) }).then((userDetails) => {

                resolve(userDetails);

            }).catch((error) => {
                reject(error);
            });


        });

    },

    updateUsersDetails: (userId, datas) => {
        let name = datas.name;
        let email = datas.email;
        let number = datas.number;

        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, {
                $set: {
                    name: name,
                    email: email,
                    number: parseInt(number)

                }
            }).then(() => {
                resolve();
            }).catch((error) => {
                reject(error);
            });
        });


    },

    cancelorderStatus: ({ orderid, proId }) => {

        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECRTION).updateOne({ _id: objectId(orderid), 'products': { $elemMatch: { 'item': objectId(proId) } } },
                { $set: { 'products.$.orderStatus': 'cancelled', 'products.$.orderCancelled': true } }
            ).then(() => {
                resolve();
            }).catch((error) => {
                reject(error);
            });
        });

    },
    checkCoupen: (useriD, coupon, totalValue) => {
        return new Promise((resolve, reject) => {
            function padTo2Digits(num) {
                return num.toString().padStart(2, '0');
            }
            db.get().collection(collection.COUPEN_COLLECTION).findOne({ couponCode: coupon }).then((coupendata) => {
                if (coupendata) {
                    let date = coupendata.date;
                    const cDate = new Date();
                    const year = cDate.getFullYear();
                    const month = padTo2Digits(cDate.getMonth() + 1);
                    const day = padTo2Digits(cDate.getDate());
                    let curentDate = [year, month, day].join('-');
                    db.get().collection(collection.USED_COUPON_COLLECTION).findOne({ user: useriD, coupon: coupendata.couponCode }).then((usedCoupen) => {
                        if (usedCoupen) {
                            resolve({ usedCoupen: true });
                        } else {
                            if (date > curentDate) {
                                let discountPrice = (totalValue * coupendata.Percentage) / 100;
                                const couponPrice = totalValue - discountPrice;
                                const usedObj = {
                                    user: useriD,
                                    coupon: coupendata.couponCode,
                                    date: curentDate,
                                    discount: discountPrice,
                                };
                                db.get().collection(collection.USED_COUPON_COLLECTION).insertOne(usedObj);
                                resolve({ couponPrice, discountPrice });




                            } else {
                                resolve({ expired: true });
                            }
                        }
                    }).catch((error) => {
                        reject(error);
                    });

                } else {
                    resolve({ invalid: true });
                }
            });
        });

    },

    addToWishlist: (userId, proId) => {
        return new Promise(async (resolve, reject) => {
            let proObj = {
                item: objectId(proId),
                quantity: 1
            };
            let userWishlist = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: objectId(userId) });
            if (userWishlist) {
                let proExist = userWishlist.products.findIndex(product => product.item == proId);
                if (proExist != -1) {
                    db.get().collection(collection.WISHLIST_COLLECTION)
                        .updateOne({ user: objectId(userId), 'products.item': objectId(proId) },
                            {
                                $inc: { 'products.$.quantity': 1 }
                            }
                        ).then(() => {
                            resolve();
                        }).catch((error) => {
                            reject(error);
                        });

                } else {


                    db.get().collection(collection.WISHLIST_COLLECTION)
                        .updateOne({ user: objectId(userId) },
                            {
                                $push: { products: proObj }
                            }
                        ).then(() => {
                            resolve();
                        }).catch((error) => {
                            reject(error);
                        });

                }

            } else {
                let wishlistObj = {
                    user: objectId(userId),
                    products: [proObj]
                };
                db.get().collection(collection.WISHLIST_COLLECTION).insertOne(wishlistObj).then((response) => {
                    resolve();
                }).catch((error) => {
                    reject(error);
                });
            }
        });
    },

    getwishlistCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0;
            let wishlist = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: objectId(userId) });


            if (wishlist) {
                count = wishlist.products.length;

            }
            resolve(count);

        });
    },
    getwishlistProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let wishlistItems = await db.get().collection(collection.WISHLIST_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'

                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }


            ]).toArray();
            resolve(wishlistItems);
        });
    },
    removeWishlistItem: ({ wishlist, product }) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.WISHLIST_COLLECTION).updateOne({ _id: objectId(wishlist) }, { $pull: { 'products': { item: objectId(product) } } }).then((data) => {

                resolve(data);
            }).catch((error) => {
                reject(error);
            });
        });
    },
    getCategory: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.BRAND_COLLECTION).find().toArray().then((response) => {
                resolve(response);

            }).catch((error) => {
                reject(error);
            });
        });
    },
    getFilterProducts: async (filters) => {
        try {
            return await new Promise(async (resolve, reject) => {
                let check = Array.isArray(filters.brandName);

                if (check) {
                    var brandNames = filters.brandName;

                    brandNames = brandNames.map(function (brand) {
                        return objectId(brand);
                    });
                }
                else {
                    filters = Object.values(filters);
                    brandNames = filters.map(function (brand_1) {


                        return objectId(brand_1);
                    });


                }
                let filterProducts = await db.get().collection(collection.PRODUCT_COLLECTION).aggregate([
                    {
                        $match: {
                            brand: {
                                $in: brandNames
                            }
                        }
                    }
                ]).toArray();
                resolve(filterProducts);

            });
        } catch (err) {
            let error = {};
            error.message = 'Something went wrong';

        }
    },
    getaddressForEdit: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ADDRESS_COLLECTION).find().toArray().then((address) => {
                resolve(address);
            }).catch((error) => {
                reject(error);
            });
        });
    },

    findRefferal: (refferal, amount) => {
        return new Promise(async (resolve, reject) => {
            let refferalUser = await db.get().collection(collection.USER_COLLECTION).findOne({ refferal: refferal });
            resolve(refferalUser);
            if (refferalUser) {
                let refferalData = {
                    Amount: parseInt(amount),
                    Date: new Date().toDateString(),
                    Timestamp: new Date(),
                    status: 'credited',
                    message: 'Refferal Amount'
                };
                db.get().collection(collection.WISHLIST_COLLECTION).updateOne({ userId: refferalUser._id }, {
                    $inc: {
                        Total: amount
                    },
                    $push: {
                        Transaction: refferalData
                    }
                });
            }
        });
    },
    addReferalMoney: (userId) => {
        return new Promise((resolve, reject) => {
            let refferalData = {
                Amount: parseInt(50),
                Date: new Date().toDateString(),
                Timestamp: new Date(),
                status: 'credited',
                message: 'Refferal Amount'
            };
            db.get().collection(collection.WISHLIST_COLLECTION).updateOne({ userId: userId }, {
                $inc: {
                    Total: 50
                },
                $push: {
                    Transaction: refferalData
                }
            }).then(() => {
                resolve();
            }).catch((error) => {
                reject(error);
            });
        });
    },
    getUserWallet: (userId) => {
        return new Promise(async (resolve, reject) => {
            let userWallet = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ userId: objectId(userId) });
            resolve(userWallet);
        });
    },

    updateaddress: (adressId, datas) => {

        let name = datas.firstname;
        let lastname = datas.lastname;
        let country = datas.country;
        let streetname = datas.streetname;
        let city = datas.city;
        let state = datas.state;
        let email = datas.email;
        let number = datas.number;
        let pincode = datas.pincode;
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collection.ADDRESS_COLLECTION).updateOne({ _id: objectId(adressId) }, {
                    $set: {
                        firstname: name,
                        lastname: lastname,
                        country: country,
                        streetname: streetname,
                        city: city,
                        state: state,
                        email: email,
                        number: parseInt(number),
                        pincode: pincode
                    }
                }).then(() => {
                    resolve();
                });
            } catch (error) {
                reject(error);
            }

        });
    },

    getWalletAmount: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.WALLET_COLLECTION).findOne({ userId: objectId(userId) }).then((wallet) => {

                resolve(wallet);
            }).catch((error) => {
                reject(error);
            });

        });
    },
    getReturnproducts: (orderId, productId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECRTION).aggregate([
                {
                    $match:
                    {
                        _id: objectId(orderId)
                    }
                },
                {
                    $unwind: '$products'
                },
                {
                    $match:
                    {
                        'products.item': objectId(productId)
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'products.item',
                        foreignField: '_id',
                        as: 'product'
                    }

                },
                {
                    $project: {
                        products: 1, deliverydetails: 1, totalAmount: 1, date: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },

            ]).toArray().then((orderDetails) => {
                resolve(orderDetails);

            });
        });

    },
    ReturnproductCollectionCreation: (returnDetails) => {
        console.log(returnDetails);
        let orderId = objectId(returnDetails.orderId);
        returnDetails.orderId = orderId;
        let productId = objectId(returnDetails.productId);
        returnDetails.productId = productId;


        return new Promise((resolve, reject) => {
            db.get().collection(collection.RETURN_COLLECTION).insertOne(returnDetails).then(() => {
                resolve();
            });

        });

    },
    updateShippingStatus: (orderId, productId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECRTION).updateOne({
                _id: objectId(orderId),
                'products': { $elemMatch: { 'item': objectId(productId) } }
            },
                {
                    $set: { 'products.$.orderStatus': 'Return-requested' }
                }).then((response) => {
                    resolve(response);
                });
        });
    },

    changePassword: (p, np, usrId) => {
        return new Promise(async (resolve, reject) => {

            let response = {};

            let userfind = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(usrId) });
            console.log(userfind);
            if (userfind) {

                p = p.toString();

                bcrypt.compare(p, userfind.password).then(async (status) => {

                    if (status) {

                        response.check = true;

                        np = np.toString();
                        let nbpass = await bcrypt.hash(np, 10);

                        db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(usrId) }, {
                            $set: {
                                password: nbpass
                            }
                        }).then((resp) => {
                            console.log(resp);
                            resolve(response);
                        });

                    } else {
                        response.check = false,
                            response.errmessage = 'password is not matching';
                        resolve(response);
                    }

                });
            }
        });
    },
    getAllproductforUser:()=>{
        return new Promise ((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).find().limit(6).toArray().then((response)=>{
                resolve(response);
            });
        });

    },
    getAllpro:()=>{
        return new Promise ((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).find().skip(6).toArray().then((response)=>{
                resolve(response);
            });
        });

    },
    getSearchedProducts:(payload)=>{
       
        return new Promise(async(resolve,reject)=>{
            let search=await db.get().collection(collection.PRODUCT_COLLECTION).find({phone:{$regex:new RegExp('^'+payload+'.*','i')}}).toArray();
            search=search.slice(0,10);
            resolve(search);
        });
    },









}; 