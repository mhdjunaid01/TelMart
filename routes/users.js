var express = require('express');
var router = express.Router();
const paypal = require('paypal-rest-sdk');
paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': 'AZKDpYNxnzUYyAL9nZdv0QWqklB1Dd3kZHHvw_-3CDGbgcX_BfWJ0pot-SfPWZW5bT0uYGfN5Qy0RpDO',
    'client_secret': 'EGRO3KVIE9_1B2VTwtz09H6UA7psrOZPORJdqr6-fwYMm96w_lF1YdK9sUVdx-t6sIU4uITdn3Fymcvl'
});

const { username,
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
    searchProducts,
} = require('../controllers/userController');

router.get('/', username);
router.post('/signup', signupPost);
router.get('/login', login);
router.get('/signup', signupGet);
router.post('/login', loginPost);
router.get('/otp', otp);
router.post('/loginotp', loginOtp);
router.get('/getotp', getOtp);
router.post('/getotp', postOtp);
router.get('/logout', logOut);
router.get('/product', paginatedResults, product);
router.get('/productview/:id', productview);
router.get('/cart', verifylogin, cart);
router.get('/addToCart/:id', addToCart);
router.post('/change-product-quantity', changeProductsQuantity);
router.get('/checkout', verifylogin, checkout);
router.post('/place-order', placeOrder);
router.get('/order', verifylogin, order);
router.post('/remove-cart', removeCart);
router.get('/orderDetails/:id', verifylogin, orderDetails);
router.get('/cancelorder/:id', cancelorder);
router.get('/cancelorderStatus', cancelorderStatus);
router.post('/verify-Payment', verifyPayment);
router.post('/pay', pay);
router.get('/success', success);
router.get('/cancel', cancel);
router.post('/selected-address', selectedAddress);
router.get('/profile', verifylogin, profile);
router.post('/saveChanges', saveChanges);
router.post('/check-coupen', checkCoupen);
router.get('/wishlist', verifylogin, wishlist);
router.get('/addToWishlist/:id', addToWishlis);
router.post('/remove-wishlist', removeWishlist);
router.get('/wishlistToCart/:id', wishlistToCart);
router.get('/filter', verifylogin, filter);
router.get('/editAddress', editAddress);
router.post('/editaddress', editaddressPost);
router.get('/wallet', wallet);
router.get('/walletOg', walletOg);
router.get('/returnProduct', returnProduct);
router.post('/return-product', returnP);
router.post('/changePassword', changePassword);
router.post('/searchProducts', searchProducts);
module.exports = router;