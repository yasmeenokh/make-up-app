DROP TABLE IF EXISTS products ;
CREATE TABLE products (
    id SERIAL PRIMARY KEY ,
    name VARCHAR(255),
    price VARCHAR(255),
    image_link VARCHAR(255),
    description TEXT
)