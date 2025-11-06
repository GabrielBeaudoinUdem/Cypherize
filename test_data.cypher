CREATE NODE TABLE Person (
    name STRING,
    born INT64,
    PRIMARY KEY (name)
)

CREATE NODE TABLE Movie (
    title STRING,
    released INT64,
    tagline STRING,
    PRIMARY KEY (title)
)

CREATE REL TABLE ACTED_IN (
    FROM Person TO Movie,
    roles STRING[]
)

CREATE REL TABLE DIRECTED (
    FROM Person TO Movie
)


CREATE (p:Person {name: 'Keanu Reeves', born: 1964})
CREATE (p:Person {name: 'Carrie-Anne Moss', born: 1967})
CREATE (p:Person {name: 'Laurence Fishburne', born: 1961})
CREATE (p:Person {name: 'Lilly Wachowski', born: 1967})


CREATE (m:Movie {title: 'The Matrix', released: 1999, tagline: 'Welcome to the Real World'})
CREATE (m:Movie {title: 'John Wick', released: 2014, tagline: '...'})

MATCH (p:Person {name: 'Keanu Reeves'}), (m:Movie {title: 'The Matrix'})
CREATE (p)-[:ACTED_IN {roles: ['Neo']}]->(m)
MATCH (p:Person {name: 'Carrie-Anne Moss'}), (m:Movie {title: 'The Matrix'})
CREATE (p)-[:ACTED_IN {roles: ['Trinity']}]->(m)
MATCH (p:Person {name: 'Laurence Fishburne'}), (m:Movie {title: 'The Matrix'})
CREATE (p)-[:ACTED_IN {roles: ['Morpheus']}]->(m)
MATCH (p:Person {name: 'Keanu Reeves'}), (m:Movie {title: 'John Wick'})
CREATE (p)-[:ACTED_IN {roles: ['John Wick']}]->(m)
MATCH (p:Person {name: 'Lilly Wachowski'}), (m:Movie {title: 'The Matrix'})
CREATE (p)-[:DIRECTED]->(m)


// MATCH (n) OPTIONAL MATCH (n)-[r]->(m) RETURN n, r, m

CREATE NODE TABLE AllTypesNode (
    id SERIAL,
    int64_val INT64,
    double_val DOUBLE,
    bool_val BOOLEAN,
    string_val STRING,
    date_val DATE,
    timestamp_val TIMESTAMP,
    PRIMARY KEY (id)
);

CREATE (n:AllTypesNode {
    int64_val: 9876543210,
    double_val: 123.456,
    bool_val: true,
    string_val: "Ceci est un test de validation",
    date_val: DATE('2024-05-21')
});

// MATCH (n:AllTypesNode) RETURN n