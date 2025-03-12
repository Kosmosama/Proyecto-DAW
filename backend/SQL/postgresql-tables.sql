CREATE TABLE User (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    photo VARCHAR(255) NOT NULL,
    last_login TIMESTAMP,
    online BOOLEAN DEFAULT FALSE
);

CREATE TABLE Friendship (
    id_user1 INT NOT NULL,
    id_user2 INT NOT NULL,
    created_at DATE NOT NULL,
    status VARCHAR(50) CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
    PRIMARY KEY (id_user1, id_user2),
    FOREIGN KEY (id_user1) REFERENCES User(id) ON DELETE CASCADE,
    FOREIGN KEY (id_user2) REFERENCES User(id) ON DELETE CASCADE
);

CREATE TABLE Team (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    team_json JSON NOT NULL,
    user_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE
);

CREATE TABLE Battle (
    id SERIAL PRIMARY KEY,
    battle_date DATE NOT NULL,
    battle_json JSON NOT NULL,
    winner_id INT,
    FOREIGN KEY (winner_id) REFERENCES User(id) ON DELETE SET NULL
);

CREATE TABLE Participates (
    battle_id INT NOT NULL,
    user_id INT NOT NULL,
    role VARCHAR(50) CHECK (role IN ('player1', 'player2')),
    team_json JSON NOT NULL,
    PRIMARY KEY (battle_id, user_id),
    FOREIGN KEY (battle_id) REFERENCES Battle(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE
);