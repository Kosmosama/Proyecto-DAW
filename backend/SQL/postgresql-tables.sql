CREATE TABLE Player (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    photo VARCHAR(255) NOT NULL,
    last_login TIMESTAMP,
    online BOOLEAN DEFAULT FALSE
);
CREATE TABLE Friendship (
    id_player1 INT NOT NULL,
    id_player2 INT NOT NULL,
    created_at DATE NOT NULL,
    status VARCHAR(50) CHECK (
        status IN ('pending', 'accepted', 'declined', 'blocked')
    ),
    PRIMARY KEY (id_player1, id_player2),
    FOREIGN KEY (id_player1) REFERENCES Player(id) ON DELETE CASCADE,
    FOREIGN KEY (id_player2) REFERENCES Player(id) ON DELETE CASCADE
);
CREATE TABLE Team (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    team_json JSON NOT NULL,
    player_id INT NOT NULL,
    FOREIGN KEY (player_id) REFERENCES Player(id) ON DELETE CASCADE
);
CREATE TABLE Battle (
    id SERIAL PRIMARY KEY,
    battle_date DATE NOT NULL,
    battle_json JSON NOT NULL,
    winner_id INT,
    FOREIGN KEY (winner_id) REFERENCES Player(id) ON DELETE
    SET NULL
);
CREATE TABLE Participates (
    battle_id INT NOT NULL,
    player_id INT NOT NULL,
    role VARCHAR(50) CHECK (role IN ('player1', 'player2')),
    team_json JSON NOT NULL,
    PRIMARY KEY (battle_id, player_id),
    FOREIGN KEY (battle_id) REFERENCES Battle(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES Player(id) ON DELETE CASCADE
);