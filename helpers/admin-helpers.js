/* eslint-disable no-unused-vars */
/* eslint-disable no-async-promise-executor */
var db = require('../config/connection');
var collection = require('../config/collections');
var objectId = require('mongodb').ObjectId;

module.exports = {
    signupuserinfo: () => {
        return new Promise((resolve) => {
            var infos = db.get().collection('userDetails').find().toArray();
            resolve(infos);
        });
    },
    addProduct: (product) => {
        let price = parseInt(product.price);
        product.price = price;
        let stock = parseInt(product.stock);
        product.stock = stock;
        let brandId = objectId(product.brand);
        product.brand = brandId;
        return new Promise((resolve, reject) => {

            db.get().collection('product').insertOne(product).then((data) => {
                resolve(data.insertedId);
            }).catch((error) => {
                reject(error);
            });
        });
    },
    updateProduct: (id, ProDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection('product').updateOne({ _id: objectId(id) }, {
                $set: {
                    phone: ProDetails.phone,
                    Price: ProDetails.Price,
                    offer: ProDetails.offer,
                    description: ProDetails.description,
                    Specs: ProDetails.specs,
                    category: ProDetails.category,
                    brand: objectId(ProDetails.brand),
                    stock: ProDetails.stock,
                    img: ProDetails.img
                }
            }).then(() => {
                resolve();
            }).catch((error) => {
                reject(error);
            });
        });
    },
    getAllproducts: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).aggregate([
                {
                     $lookup: 
                     { 
                        from: 'category', 
                        localField: 'brand', 
                        foreignField: '_id', 
                        as: 'productCategory' 
                    } 
                }]).toArray().then((products) => {
                resolve(products);
            }).catch((error) => {
                reject(error);
            });

        });
    },
    userdelete: (objID) => {
        return new Promise((resolve, reject) => {
            try {
                var infos = db.get().collection('product').deleteOne({ _id: objectId(objID) });
                resolve(infos);
            } catch (error) {
                reject(error);
            }

        });
    },
    blockuser: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection('userDetails').updateOne({ _id: objectId(id) }, { $set: { signupstatus: false } }).then(() => {
                resolve();
            }).catch((error) => {
                reject(error);

            });

        });
    },
    getbrand: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.BRAND_COLLECTION).find().toArray().then((brand) => {
                resolve(brand);
            }).catch((error) => {
                reject(error);
            });


        });
    },
    unblockuser: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection('userDetails').updateOne({ _id: objectId(id) }, { $set: { signupstatus: true } }).then((block) => {
                resolve(block);
            }).catch((error) => {
                reject(error);
            });
        });
    },
    getProductDetails: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(id) }).then((product) => {
                resolve(product);
            }).catch((error) => {
                reject(error);
            });
        });
    },

    addcategory: (category) => {
        return new Promise((resolve, reject) => {
            db.get().collection('category').insertOne(category).then(() => {
                resolve();
            }).catch((error) => {
                reject(error);
            });
        });
    },
    getCategory: () => {
        return new Promise((resolve, reject) => {
            db.get().collection('category').find().toArray().then((data) => {
                resolve(data);
            }).catch((error) => {
                reject(error);
            });
        });
    },
    productView: (productId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(productId) });
                resolve(product);
            } catch (error) {
                reject(error);
            }
        });
    },
    catagorydelete: (objID) => {
        return new Promise(async (resolve, reject) => {
            try {
                var info = await db.get().collection('category').deleteOne({ _id: objectId(objID) });
                resolve(info);

            } catch (error) {
                reject(error);
            }
        });
    },
    getUserOrders: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let orders = await db.get().collection(collection.ORDER_COLLECRTION).find().sort({ '_id': -1 }).toArray();
                resolve(orders);

            } catch (error) {
                reject(error);
            }

        });
    },

    ProductDetails: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECRTION).aggregate([
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
                        status: '$products.orderStatus'
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
                        status: 1, item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $addFields:
                    {
                        convertPrice: { $toInt: '$product.price' }
                    }
                },
                {
                    $project: {
                        total: { $multiply: ['$quantity', '$convertPrice'] }, status: 1, quantity: 1, product: 1
                    }
                }
            ]).toArray().then((response) => {
                console.log(response);
                resolve(response);
            }).catch((error) => {
                reject(error);
            });

        });
    },
    changeDeliveryStatus: (details) => {
        let status = details.status;
        let orderId = details.orderId;
        let productId = details.ProductId;
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECRTION).updateOne({ _id: objectId(orderId), 'products': { $elemMatch: { 'item': objectId(productId) } } },
                { $set: { 'products.$.orderStatus': status } }

            ).then((response) => {
                resolve(response);
            }).catch((error) => {
                reject(error);
            });
        });
    },

    getDailyOrders: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECRTION).aggregate([
                {
                    $group: { _id: '$date', dailySales: { $sum: '$totalAmount' } }
                }
            ]).toArray().then((dailySales) => {
                resolve(dailySales);

            }).catch((error) => {
                reject(error);
            });
        });
    },
    getMonthlyOrders: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECRTION).aggregate([
                {
                    $group: { _id: '$month', monthlySales: { $sum: '$totalAmount' } }
                }
            ]).toArray().then((monthlySales) => {
                resolve(monthlySales);

            }).catch((error) => {
                reject(error);
            });
        });
    },
    getyearlyOrders: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECRTION).aggregate([
                {
                    $group: { _id: '$year', yearlySales: { $sum: '$totalAmount' } }
                }
            ]).toArray().then((yearlySales) => {
                resolve(yearlySales);

            }).catch((error) => {
                reject(error);
            });
        });
    },

    dailysalesreport: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECRTION).aggregate([
                {
                    $group: {
                        _id: '$date',
                        dailySaleAmount: { $sum: '$totalAmount' },
                        count: { $sum: 1 }
                    }
                }
            ]).toArray().then((dailysalesreport) => {
                resolve(dailysalesreport);

            }).catch((error) => {
                reject(error);
            });
        });
    },
    monthlySalesReport: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECRTION).aggregate([
                {
                    $group: {
                        _id: '$month',
                        monthlySalesamount: { $sum: '$totalAmount' },
                        count: { $sum: 1 }
                    }
                }
            ]).toArray().then((monthlySalesReport) => {
                resolve(monthlySalesReport);

            }).catch((error) => {
                reject(error);
            });
        });
    },
    yearlySalesReport: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECRTION).aggregate([
                {
                    $group: {
                        _id: '$year',
                        yearlySalesAmonunt: { $sum: '$totalAmount' },
                        count: { $sum: 1 }
                    }
                }
            ]).toArray().then((yearlySalesReport) => {
                resolve(yearlySalesReport);

            }).catch((error) => {
                reject(error);
            });


        });

    },

    categoryManagement: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.BRAND_COLLECTION).find().toArray().then((brands) => {
                resolve(brands);

            }).catch((error) => {
                reject(error);
            });

        });
    },

    categoryWithOffer: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.BRAND_COLLECTION).find({ Addoffer: true }).toArray().then((offerBrands) => {
                resolve(offerBrands);
            }).catch((error) => {
                reject(error);
            });
        });
    },

    addoffer: (Percentage, brandID) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.BRAND_COLLECTION).updateOne({ _id: objectId(brandID) }, {
                $set:
                {
                    Addoffer: true,
                    Percentage: parseInt(Percentage.offerPercentage)


                }
            }),
                db.get().collection(collection.PRODUCT_COLLECTION).find({ brand: objectId(brandID) }).toArray().then((offerProduct) => {
                    resolve(offerProduct);

                }).catch((error) => {
                    reject(error);
                });
        });

    },

    removeoffer: (brandID) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.BRAND_COLLECTION).findOne({ _id: objectId(brandID) }).then((data) => {
                db.get().collection(collection.BRAND_COLLECTION).updateOne({ _id: objectId(brandID) }, {
                    $unset:
                    {
                        Addoffer: true,
                        Percentage: data.Percentage
                    }
                }),
                    db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ brand: objectId(brandID) }, {
                        $unset:
                        {
                            offPrice: '',
                            originalPrice: '',
                            Percentage: '',
                        }
                    });
                resolve();
            }).catch((error) => {
                reject(error);
            });

        });

    }, applyOffer: (product, Percentage) => {
        return new Promise((resolve, reject) => {
            Percentage = parseInt(Percentage);
            let offerPrice = Math.round(product.price - (product.price * Percentage) / 100);
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(product._id) },
                { $set: { offPrice: offerPrice, originalPrice: product.price, Percentage: Percentage } }).then(() => {
                    db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(product._id) },
                        { $set: { price: offerPrice } }).then(() => {
                            resolve();

                        });
                }).catch((error) => {
                    reject(error);
                });
        });
    },
    getallcoupon: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.COUPEN_COLLECTION).find().toArray().then((coupon) => {
                resolve(coupon);
            }).catch((error) => {
                reject(error);
            });
        });

    },
    addcoupen: (coupon) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.COUPEN_COLLECTION).insertOne(coupon).then(() => {
                resolve();
            }).catch((error) => {
                reject(error);
            });
        });
    },

    removeCoupon: (couponId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.COUPEN_COLLECTION).deleteOne({ _id: objectId(couponId) }).then(() => {
                resolve();
            }).catch((error) => {
                reject(error);
            });
        });

    },
    paymentMethodCOD: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let cod = await db.get().collection(collection.ORDER_COLLECRTION).aggregate([
                    {
                        $match: {
                            'status': { $nin: ['cancelled'] }
                        }
                    },
                    {
                        $match: { paymentMethod: 'COD' }
                    },
                    {
                        $group: {
                            _id: '$paymentMethod',
                            count: { $sum: 1 },

                        }
                    },

                ]).toArray();

                resolve(cod);

            } catch (error) {
                reject(error);

            }

        });

    },
    paymentMethodPaypal: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let paypal = await db.get().collection(collection.ORDER_COLLECRTION).aggregate([

                    {
                        $match: {
                            'status': { $nin: ['cancelled'] }
                        }
                    },
                    {
                        $match: { paymentMethod: 'PAYPAL' }
                    },
                    {
                        $group: {
                            _id: '$paymentMethod',
                            count: { $sum: 1 },

                        }
                    },
                ]).toArray();
                resolve(paypal);
            } catch (error) {
                reject(error);
            }
        });
    },
    paymentMethodRazorpy: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let razorpay = await db.get().collection(collection.ORDER_COLLECRTION).aggregate([

                    {
                        $match: {
                            'status': { $nin: ['cancelled'] }
                        }
                    },
                    {
                        $match: { paymentMethod: 'ONLINE' }
                    },
                    {
                        $group: {
                            _id: '$paymentMethod',
                            count: { $sum: 1 },
                        }
                    },
                ]).toArray();
                resolve(razorpay);
            } catch (error) {
                reject(error);
            }
        });
    },

    returnedProducts: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.RETURN_COLLECTION).aggregate([
                {
                    $lookup:
                    {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'productId',
                        foreignField: '_id',
                        as: 'productDetails'
                    }
                },
                {
                    $unwind: '$productDetails'
                },
                {
                    $lookup:
                    {
                        from: collection.ORDER_COLLECRTION,
                        localField: 'orderId',
                        foreignField: '_id',
                        as: 'orderDetails'
                    },
                },
                {
                    $unwind: '$orderDetails'
                }

            ]).toArray().then((returnProduct) => {
                console.log(returnProduct);
                resolve(returnProduct);
            });
        });
    }



};
