const { response } = require('express');

const adminHelpers = require('../helpers/admin-helpers');

var adminhelper = require('../helpers/admin-helpers');
// var userhelper= require('../helpers/user-helper');                               

/* GET home page. */


let logErr;

const verifylogin = (req, res, next) => {
    if (req.session.loggedin) {
        next();
    } else {
        res.redirect('/admin/adminlogin');

    }
};

let home = (req, res) => {  
    
    adminHelpers.getDailyOrders().then((dailySales) => {
        adminHelpers.getMonthlyOrders().then((monthlySales) => {
            adminHelpers.getyearlyOrders().then((yearlySales) => {
                adminHelpers.paymentMethodCOD().then((cod) => {
                    adminHelpers.paymentMethodPaypal().then((paypal) => {
                        adminHelpers.paymentMethodRazorpy().then((razor) => {
                            res.render('admin/admin-home', { adminheader: true, adminlink: true, dailySales, monthlySales, yearlySales, cod, paypal, razor });

                        });
                    });
                });
            });
        });
    });
};
let adminlogin = (req, res) => {
    res.render('admin/admin-login', { adminlink: true, logErr });
    logErr = '';
};
let adminloginPost = (req, res) => {
    const admin =
    {
        userid: process.env.userid,
        password: process.env.password
    };
    if (req.body.email == admin.userid && req.body.password == admin.password) {
        req.session.loggedin = true;
        res.redirect('/admin');
    } else {
        logErr = 'enter valid email or password';

        res.redirect('/admin/adminlogin');
    }

};
let addproduct = async (req, res) => {

    let brand = await adminHelpers.getbrand();
    res.render('admin/add-product', { brand, adminheader: true, adminlink: true });

};
let addproductPost = (req, res) => {
    const files = req.files;
    const file = files.map((file) => {
        return file;
    });
    const fileName = file.map((file) => {
        return file.filename;
    });
    const product = req.body;
    product.img = fileName;
    adminHelpers.addProduct(product).then(() => {

        res.redirect('/admin/addproduct');
    });
};
let editproduct = (req, res) => {
    adminhelper.getProductDetails(req.params.id).then((product) => {
        adminHelpers.getCategory().then((data) => {
            res.render('admin/edit-product', { product, data, adminheader: true, adminlink: true });
        });
    });
};
let editproductPost = (req, res) => {
    const files = req.files;
    const file = files.map((file) => {
        return file;
    });
    const fileName = file.map((file) => {
        return file.filename;
    });
    const product = req.body;
    product.img = fileName;
    adminhelper.updateProduct(req.params.id, product).then(() => {

        res.redirect('/admin/viewproduct');
    });
};
let viewproduct = (req, res) => {
    adminhelper.getAllproducts().then((products) => {
        res.render('admin/view-product', { products, adminheader: true, adminlink: true });
    });

};
let adminlogout = (req, res) => {
    req.session.loggedin = false;
    res.render('admin/admin-login', { adminlink: true });
};
let deletee = (req, res) => {
    var objID = req.params.id;
    adminhelper.userdelete(objID).then((response) => {
        console.log(response);
        res.redirect('/admin/viewproduct');
    });
};
let userblock = (req, res) => {
    let { id } = req.params;
    adminhelper.blockuser(id).then(() => {
        res.redirect('/admin/userlist');
    });
};
let userUnblock = (req, res) => {
    let { id } = req.params;
    adminhelper.unblockuser(id).then(() => {
        res.redirect('/admin/userlist');
    });

};
let userlist = (req, res) => {

    logErr = req.session.logErr;
    adminhelper.signupuserinfo().then((response) => {
        res.render('admin/userlist', { response, adminheader: true, adminlink: true });
    });

};
let category = (req, res) => {
    adminhelper.getCategory().then((category) => {
        res.render('admin/category-management', { category, adminheader: true, adminlink: true });
    });

};
let addCategory = (req, res) => {
    const files = req.files;
    const file = files.map((file) => {
        return file;
    });
    const fileName = file.map((file) => {
        return file.filename;
    });
    const product = req.body;
    product.img = fileName;
    adminhelper.addcategory(product).then(() => {
        res.redirect('/admin/category');
    });
};
let addcategoryGet = (req, res) => {
    res.render('admin/add-category', { adminheader: true, adminlink: true });
};
let categoryDelete = (req, res) => {
    var cataId = req.params.id;
    adminHelpers.catagorydelete(cataId).then(() => {
        res.redirect('/admin/category');
    });

};
let AdminOrderManagement = async (req, res) => {
    let orders = await adminHelpers.getUserOrders();

    res.render('admin/order', { adminlink: true, adminheader: true, orders });
};
let AdminOrderDetails = async (req, res) => {
    let products = await adminHelpers.ProductDetails(req.params.id);
    products.forEach(element => {
        if (element.status == 'cancelled') {
            element.cancelStatus = true;
        } else {
            element.cancelStatus = false;
        }
    });
    res.render('admin/adminOrderDetail', { adminlink: true, adminheader: true, products });
};
let changeOrderStatus = (req, res) => {
    try {
        adminHelpers.changeDeliveryStatus(req.body);
        res.json(response);

    } catch (error) {
        console.log(error);

    }

};
let salesReport = (req, res) => {
    adminHelpers.dailysalesreport().then((dailysalesreport) => {
        adminHelpers.monthlySalesReport().then((monthlySalesReport) => {
            adminHelpers.yearlySalesReport().then((yearlySalesReport) => {
                res.render('admin/salesReport', { adminlink: true, adminheader: true, dailysalesreport, monthlySalesReport, yearlySalesReport });

            });
        });
    });
};
let categoryManagement = (req, res) => {
    adminHelpers.categoryManagement().then((brands) => {
        adminHelpers.categoryWithOffer().then((offerBrands) => {
            res.render('admin/categoryOfferManagement', { adminlink: true, adminheader: true, brands, offerBrands });

        });
    });
};
let addcategoryOffer = (req, res) => {
    let brandID = req.params.id;
    adminHelpers.addoffer(req.body, brandID).then((data) => {
        data.forEach(element => {
            adminHelpers.applyOffer(element, req.body.offerPercentage);


        });
        res.redirect('/admin/categoryManagement');

    });
};
let removeOffer = (req, res) => {
    let brandID = req.params.id;

    adminHelpers.removeoffer(brandID).then(() => {
        res.redirect('/admin/categoryManagement');
    });

};
let Coupon = (req, res) => {
    adminHelpers.getallcoupon().then((coupon) => {
        res.render('admin/coupen', { adminlink: true, adminheader: true, coupon });

    });


};
let addcoupon = (req, res) => {

    adminHelpers.addcoupen(req.body).then(() => {
        res.redirect('/admin/Coupon');

    });
};
let removecoupon = (req, res) => {
    let couponId = req.params.id;
    adminHelpers.removeCoupon(couponId).then(() => {
        res.redirect('/admin/Coupon');
    });

};
let returnProducts= (req,res)=>{
adminHelpers.returnedProducts().then((returnProduct)=>{
     
    returnProduct.forEach(element => {

        if(element.orderStatus==='return-Approved'){
            returnProduct.returnApproved=true;
        }  
    });
    
    res.render('admin/returnAdmin',{ adminlink: true, adminheader: true, returnProduct});

});
};

module.exports = {
    home,
    adminlogin,
    adminloginPost,
    addproduct,
    addproductPost,
    editproduct,
    editproductPost,
    viewproduct,
    adminlogout,
    deletee,
    userblock,
    userUnblock,
    userlist,
    category,
    addCategory,
    addcategoryGet,
    categoryDelete,
    AdminOrderManagement,
    AdminOrderDetails,
    changeOrderStatus,
    salesReport,
    categoryManagement,
    addcategoryOffer,
    removeOffer,
    Coupon,
    addcoupon,
    removecoupon,
    verifylogin,
    returnProducts
};