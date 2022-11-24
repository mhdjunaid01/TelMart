var express = require('express');
var router = express.Router();
// var userhelper= require('../helpers/user-helper');                               
var { upload } = require('../public/javascripts/fileUpload');
/* GET home page. */
const {
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
} = require('../controllers/adminController');

router.get('/', verifylogin, home);
router.get('/adminlogin', adminlogin);
router.post('/adminlogin', adminloginPost);
router.get('/addproduct', verifylogin, addproduct);
router.post('/addproduct', upload.array('image'), addproductPost);
router.get('/editproduct/:id', verifylogin, editproduct);
router.post('/editproduct/:id', upload.array('image'), editproductPost);
router.get('/viewproduct', verifylogin, viewproduct);
router.get('/adminlogout', adminlogout);
router.get('/delete/:id', verifylogin, deletee);
router.get('/userblock/:id', verifylogin, userblock);
router.get('/userUnblock/:id', userUnblock);
router.get('/userlist', verifylogin, userlist);
router.get('/category', verifylogin, category);
router.post('/add-category', upload.any('image'), verifylogin, addCategory);
router.get('/addcategory', verifylogin, addcategoryGet);
router.get('/categoryDelete/:id', verifylogin, categoryDelete);
router.get('/AdminOrderManagement', verifylogin, AdminOrderManagement);
router.get('/AdminOrderDetails/:id', verifylogin, AdminOrderDetails);
router.post('/changeOrderStatus', changeOrderStatus);
router.get('/salesReport', salesReport);
router.get('/categoryManagement', categoryManagement);
router.post('/addcategoryOffer/:id', addcategoryOffer);
router.get('/removeOffer/:id', removeOffer);
router.get('/Coupon', Coupon);
router.post('/addcoupon', addcoupon);
router.get('/removecoupon/:id', removecoupon);
router.get('/return', returnProducts);
module.exports = router;
