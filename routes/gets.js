const express = require('express');
const router = express.Router();
const neo4j_calls = require('../controllers/neo4j');

router.get('/categories', async function (req, res, next) {
    let result = await neo4j_calls.get_categories();
    console.log("RESULT IS", result);
    res.status(200).send({ result })    //Can't send just a Number; encapsulate with {} or convert to String.     
    return { result };
});

router.get('/categories_count', async function (req, res, next) {
    let result = await neo4j_calls.get_all_categories_count();
    let size = 0;
    if (result != null) {
        size = result.length;
    }
    res.status(200).send({
        data: result,
        total: size,
        error: null,
    });
});

router.get('/products_by_category', async function (req, res, next) {
    const {name} = req.query;
    if (name == undefined || name == "") {
        return res.status(400).send({
            data: null,
            total: 0,
            error: "The request requires a valid category name!",
        });
    } else {
        let result = await neo4j_calls.get_products_from_category(name);
        return res.status(200).send({
            data: result,
            total: result.length,
            error: null,
        });
    }
});

router.get('/related_products', async function (req, res, next) {
    const {id} = req.query;
    if (id == undefined || id == "") {
        return res.status(400).send({
            data: null,
            total: 0,
            error: "The request requires a valid product ID!",
        });
    } else {
        let result = await neo4j_calls.get_related_products(id);
        return res.status(200).send({
            data: result,
            total: result.length,
            error: null,
        });
    }
});

router.get('/products', async function (req, res, next) {
    let result = await neo4j_calls.get_all_products();
    return res.status(200).send({
        data: result,
        total: result.length,
        error: null,
    });
});

router.get('/product', async function (req, res, next) {
    const {id} = req.query;
    let result = await neo4j_calls.get_product_by_id(id);
    return res.status(200).send({
        data: result,
        total: result.length,
        error: null,
    });
});


router.get('/best_seller', async function (req, res, next) {
    let result = await neo4j_calls.get_best_seller();
    return res.status(200).send({
        data: result,
        total: result.length,
        error: null,
    });
});

module.exports = router;