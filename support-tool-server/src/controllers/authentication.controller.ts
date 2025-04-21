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
            const sessionData = { 
                id: users.rows[0].userId, 
                userName: username, 
                token: JSON.parse(response.body).access_token 
            };
            const expireTime = new Date();
            expireTime.setHours(expireTime.getHours() + 24);
            await pool.query(
                'INSERT INTO sessions (sid, user_id, session_data, expire) VALUES ($1, $1, $2, $3) ON CONFLICT (user_id) DO UPDATE SET session_data = $2, expire = $3',
                [users.rows[0].userId, JSON.stringify(sessionData), expireTime]
            );
            res
            .status(200)
            .send({ status: 200, message: 'User authenticated successfully', userId: users.rows[0].userId});
          });
      }catch(er){
        res.status(500).send({ status: 500, message: 'Internal server error'});
      }
      
}

export const logout = (req: any, res: any) => {
    const userId = req.session.userId;
    req.session.destroy(async (err: any) => {
        if (err) {
            return res.status(500).send({ status: 500, message: 'Internal server error' });
        }
        try {
            await pool.query('DELETE FROM sessions WHERE user_id = $1', [userId]); // Ensure the column name matches your database schema
            res.status(200).send({ status: 200, message: 'User logged out successfully' });
        } catch (error) {
            res.status(500).send({ status: 500, message: 'Failed to delete session from database' });
        }
    });
};