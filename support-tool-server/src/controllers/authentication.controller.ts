import request from 'request';
import pool from '../config/database';

export const authenticateKeycloakUser = (req: any, res: any) => {
    const {username, password} = req.body;
    const options = {
        'method': 'POST',
        'url': 'https://portal.dev.karmayogibharat.net/auth/realms/sunbird/protocol/openid-connect/token',
        'headers': {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        form: {
          'client_id': 'support_igot',
          'password': password,
          'grant_type': 'password',
          'username': username,
          'client_secret': '9bce5c85-d2d4-4390-9432-df705f7a20d0'
        }
      };
      try {
        request(options, async function (error, response) {
            if (error) throw new Error(error);
            const users: any = await pool.query('SELECT * FROM users WHERE \"userName\" = $1', [username]);
            if (users.rows.length === 0) {
              res.status(401).send({ message: 'Invalid username or password' });
              return;
            }
            req.session.user = { id: users.rows[0].userId, userName: username, token: JSON.parse(response.body).access_token };
            req.session.save();
            res
            .status(200)
            .send({ status: 200, message: 'User authenticated successfully'});
          });
      }catch(er){
        res.status(500).send({ status: 500, message: 'Internal server error'});
      }
      
}

export const logout = (req: any, res: any) => {
    req.session.destroy((err: any) => {
        if (err) {
            return res.status(500).send({ status: 500, message: 'Internal server error' });
        }
        res.status(200).send({ status: 200, message: 'User logged out successfully' });
    });
};