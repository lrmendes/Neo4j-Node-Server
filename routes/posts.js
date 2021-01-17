const express = require('express');
const router = express.Router();
const neo4j_calls = require('../controllers/neo4j');

router.post('/create_relation', async function (req, res, next) {
    const {p1,p2} = req.body;
    let result = await neo4j_calls.create_relation(p1,p2);
    if (result != null) {
        return res.status(200).send({
            data: result,
            error: null,
        });
    } else {
        return res.status(400).send({
            data: null,
            error: "Error",
        });
    }
});

router.post('/create_relations', async function (req, res, next) {
    let {products} = req.body;
    products = products.filter((first, next, array) => array.indexOf(first) === next);
    let makeRelations = await neo4j_calls.create_relations(products);
    if (makeRelations) {
        return res.status(200).send({
            data: "Sucess",
            error: null,
        });
    } else {
        return res.status(400).send({
            data: null,
            error: "Error",
        });
    }
});


module.exports = router;