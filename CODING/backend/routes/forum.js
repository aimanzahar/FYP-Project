const express = require('express');
const router = express.Router();

module.exports = (db) => {
  const router = express.Router();

  router.get('/threads', (req, res) => {
    db.query('SELECT * FROM threads', (err, results) => {
      if (err) return res.status(500).json({ error: err });
      res.json(results);
    });
  });

  // Get all threads
router.get('/threads', (req, res) => {
  const sql = `
    SELECT t.id, t.title, t.content, t.created_at, u.Username
    FROM threads t
    JOIN users u ON t.user_id = u.id
    ORDER BY t.created_at DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// Create a new thread
router.post('/threads', (req, res) => {
  const { user_id, title, content } = req.body;
  const sql = 'INSERT INTO threads (user_id, title, content) VALUES (?, ?, ?)';
  db.query(sql, [user_id, title, content], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: 'Thread created successfully', thread_id: result.insertId });
  });
});

// Get a single thread and its replies
router.get('/threads/:id', (req, res) => {
  const threadId = req.params.id;

  const threadSql = `
    SELECT t.id, t.title, t.content, t.created_at, u.Username
    FROM threads t
    JOIN users u ON t.user_id = u.id
    WHERE t.id = ?
  `;

  const replySql = `
    SELECT r.id, r.content, r.created_at, u.Username
    FROM replies r
    JOIN users u ON r.user_id = u.id
    WHERE r.thread_id = ?
    ORDER BY r.created_at ASC
  `;

  db.query(threadSql, [threadId], (err, threadResult) => {
    if (err) return res.status(500).json({ error: err });
    if (threadResult.length === 0) return res.status(404).json({ error: 'Thread not found' });

    db.query(replySql, [threadId], (err, repliesResult) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ thread: threadResult[0], replies: repliesResult });
    });
  });
});

// Post a reply
router.post('/threads/:id/replies', (req, res) => {
  const { user_id, content } = req.body;
  const threadId = req.params.id;
  const sql = 'INSERT INTO replies (thread_id, user_id, content) VALUES (?, ?, ?)';
  db.query(sql, [threadId, user_id, content], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: 'Reply added successfully' });
  });
});

module.exports = router;

  return router;
};


