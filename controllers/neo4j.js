let neo4j = require('neo4j-driver');
let { creds } = require("../config/credentials");
let driver = neo4j.driver("bolt://0.0.0.0:7687", neo4j.auth.basic(creds.neo4jusername, creds.neo4jpw));

//Comparer Function    
function GetSortOrder(prop) {    
    return function(a, b) {    
        if (a[prop] > b[prop]) {    
            return 1;    
        } else if (a[prop] < b[prop]) {    
            return -1;    
        }    
        return 0;    
    }    
}

// *************

exports.get_categories = async function () {
    let session = driver.session();
    const nodes = await session.run('MATCH (n: Category) RETURN n', {
    });
    let result = [];
    if (nodes.records.length > 0) {
        nodes.records.map(node => {
            let categoryName = node._fields[0].properties.name;
            if (! result.includes(categoryName)) {
                result.push(categoryName);
            }
        });
    }
    result = result.sort();
    return (result);
};

exports.get_all_products = async function () {
    let session = driver.session();
    const nodes = await session.run('MATCH (n: Product) RETURN n', {
    });

    let result = [];
    if (nodes.records.length > 0) {
        nodes.records.map(record => {
            record._fields[0].properties.image = record._fields[0].properties.image.split('|');
            record._fields[0].properties.about = record._fields[0].properties.about.split('| ');
            record._fields[0].properties.category = record._fields[0].properties.category.split('| ');
            record._fields[0].properties.specification = record._fields[0].properties.specification.split('|');
            record._fields[0].properties = {
                id: record._fields[0].identity.low,
                ...record._fields[0].properties
            };
            result.push(record._fields[0].properties);
        });
    }
    return (result);
};

exports.get_products_from_category = async function (category_name) {
    let session = driver.session();
    const nodes = await session.run('MATCH (p: Product)-[r:IS]-(c: Category {name: $name}) RETURN p', {
        name: category_name,
    });
    let result = [];
    if (nodes != null) {
        nodes.records.map(record => {
            record._fields[0].properties.image = record._fields[0].properties.image.split('|');
            record._fields[0].properties.about = record._fields[0].properties.about.split('| ');
            record._fields[0].properties.category = record._fields[0].properties.category.split('| ');
            record._fields[0].properties.specification = record._fields[0].properties.specification.split('|');
            record._fields[0].properties = {
                id: record._fields[0].identity.low,
                ...record._fields[0].properties
            };
            result.push(record._fields[0].properties);
        });
    }
    return result;
};

exports.get_all_categories_count = async function (category_name) {
    let result = [];

    // Get All Category Names
    const neo4j_calls = require('./neo4j');
    let categories = await neo4j_calls.get_categories();

    // Get quantity of Products for each Category
    return await Promise.all(
        categories.map(async (category) => {
            // Start Auxiliar Session
            let session_aux = driver.session();
            const nodes = await session_aux.run('MATCH (p: Product)-[r:IS]-(c: Category {name: $name}) RETURN p', {
                name: category,
            });
            session_aux.close();
            result.push({name: category, total: nodes.records.length});
        })
    )
    .then((values) => {
        result = result.sort(GetSortOrder("name"));
        return (result);
    }).catch(error => {
        return (null);
    });
};

exports.get_product_by_id = async function (product_id) {
    let session = driver.session();
    const nodes = await session.run('MATCH (p1: Product) WHERE id(p1)=$id RETURN p1', {
        id: neo4j.int(product_id),
    });
    session.close();

    let result = null;

    nodes.records.map(record => {
        record._fields[0].properties.image = record._fields[0].properties.image.split('|');
        if (record._fields[0].properties.image.length > 1) {
            record._fields[0].properties.image.pop();
        }

        record._fields[0].properties.about = record._fields[0].properties.about.split('| ');
        record._fields[0].properties.category = record._fields[0].properties.category.split('| ');

        record._fields[0].properties.specification = record._fields[0].properties.specification.replace(/:/g, ": ");
        record._fields[0].properties.specification = record._fields[0].properties.specification.split('|');
        record._fields[0].properties.specification = record._fields[0].properties.specification.filter(item => !item.includes("Thisitemcanbe"));
        
        record._fields[0].properties = {
            id: record._fields[0].identity.low,
            ...record._fields[0].properties
        };
        result = record._fields[0].properties;
    });
   

    return result;
}

exports.get_best_seller = async function () {
    let session = driver.session();
    const nodes = await session.run(
        'MATCH (p1: Product)-[r:RELATED]-(p2: Product) RETURN DISTINCT p2, sum(r.tier1 * 0.5 + r.tier2 * 0.3 + r.tier3 * 0.2) as relation ORDER BY relation DESC',
    );
    session.close();

    let result = [];
    let knowIds = [];
    nodes.records.map(record => {
        record._fields[0].properties.image = record._fields[0].properties.image.split('|');
        if (record._fields[0].properties.image.length > 1) {
            record._fields[0].properties.image.pop();
        }

        record._fields[0].properties.about = record._fields[0].properties.about.split('| ');
        record._fields[0].properties.category = record._fields[0].properties.category.split('| ');

        record._fields[0].properties.specification = record._fields[0].properties.specification.replace(/:/g, ": ");
        record._fields[0].properties.specification = record._fields[0].properties.specification.split('|');
        record._fields[0].properties.specification = record._fields[0].properties.specification.filter(item => !item.includes("Thisitemcanbe"));
        
        record._fields[0].properties = {
            id: record._fields[0].identity.low,
            ...record._fields[0].properties,
            relation: record._fields[1]
        };
        if (!knowIds.includes(record._fields[0].identity.low)) {
            result.push(record._fields[0].properties);
            knowIds.push(record._fields[0].identity.low);
        }
    });
    return result;
}

exports.get_related_products = async function (product_id) {
    let session = driver.session();
    /*const nodes = await session.run('MATCH (p1: Product)-[r:RELATED]-(p2: Product) WHERE id(p1)=$id RETURN p2 ORDER BY r.weight DESC LIMIT 9', {
        id: neo4j.int(product_id),
    });*/
    const nodes = await session.run(
        'MATCH (p1: Product)-[r:RELATED]-(p2: Product) WHERE id(p1)=$id RETURN p2, (r.tier1 * 0.5 + r.tier2 * 0.3 + r.tier3 * 0.2) as relation ORDER BY relation DESC',
        {
            id: neo4j.int(product_id),
        }
    );
    session.close();

    let result = [];
    let knowIds = [product_id];

    if (nodes != null) {
        nodes.records.map(record => {
            record._fields[0].properties.image = record._fields[0].properties.image.split('|');
            record._fields[0].properties.about = record._fields[0].properties.about.split('| ');
            record._fields[0].properties.category = record._fields[0].properties.category.split('| ');
            record._fields[0].properties.specification = record._fields[0].properties.specification.split('|');
            record._fields[0].properties = {
                id: record._fields[0].identity.low,
                ...record._fields[0].properties,
                relation: record._fields[1]
            };
            result.push(record._fields[0].properties);
            knowIds.push(record._fields[0].identity.low);
            //result.push(record);
        });
    }
    /*
    if (result.length < 9) {
        let session2 = driver.session();
        //const nodes = await session.run('match (:Product) with count(*) as docCount match (p:Product) where rand() < 10.0/docCount return p', {});
        const nodes = await session2.run('match (p:Product) return p, rand() as r ORDER BY r', {});
        session2.close();
        // Map All Results
        nodes.records.map(record => {
            if (result.length < 9) {
                if (!knowIds.includes(record._fields[0].identity.low)) {
                    record._fields[0].properties.image = record._fields[0].properties.image.split('|');
                    record._fields[0].properties.about = record._fields[0].properties.about.split('| ');
                    record._fields[0].properties.category = record._fields[0].properties.category.split('| ');
                    record._fields[0].properties.specification = record._fields[0].properties.specification.split('|');
                    record._fields[0].properties = {
                        id: record._fields[0].identity.low,
                        ...record._fields[0].properties
                    };
                    result.push(record._fields[0].properties);
                }
            }
        });   
    };
    */
    return result;
};

exports.create_relation = async function (p1,p2) {
    let session = driver.session();
    let today = new Date();
    const nodes = await session.run(
        'MATCH (p1: Product), (p2: Product) WHERE id(p1)=$id1 AND id(p2)=$id2 MERGE (p1)-[r:RELATED]-(p2) ON CREATE SET r.tier1 = 1, r.tier2 = 0, r.tier3 = 0, r.date = $date ON MATCH SET r.tier1 = r.tier1 + 1 RETURN r',
        {
            id1: neo4j.int(p1),
            id2: neo4j.int(p2),
            date: new neo4j.types.DateTime(today.getFullYear(), today.getMonth()+1, today.getDate(), 0, 0, 0, 000000000, 0),
        }
    );
    session.close();
    return nodes;
}

exports.create_relations = async function (products) {
    let today = new Date();
    // Get quantity of Products for each Category
    return await Promise.all(
        products.map(async (product_id) => {
            products.map(async product2_id => {
                if (product_id != product2_id) {
                    let session = driver.session();
                    const nodes = await session.run(
                        'MATCH (p1: Product), (p2: Product) WHERE id(p1)=$id1 AND id(p2)=$id2 MERGE (p1)-[r:RELATED]-(p2) ON CREATE SET r.tier1 = 1, r.tier2 = 0, r.tier3 = 0, r.date = $date ON MATCH SET r.tier1 = r.tier1 + 1 RETURN r',
                        {
                            id1: neo4j.int(product_id),
                            id2: neo4j.int(product2_id),
                            date: new neo4j.types.DateTime(today.getFullYear(), today.getMonth()+1, today.getDate(), 0, 0, 0, 000000000, 0),
                        }
                    );
                    session.close();
                }
            });
        })
    )
    .then((values) => {
        return (true);
    }).catch(error => {
        return (false);
    });

    
    return nodes;
}