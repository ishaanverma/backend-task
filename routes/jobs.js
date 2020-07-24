/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
const express = require('express');
const Queue = require('bull');
const conn = require('../connection');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ page: 'Jobs endpoint' });
});

router.post('/create', async (req, res) => {
  // add job to queue and return job ID
  const taskQueue = new Queue('tasks', conn);
  try {
    const job = await taskQueue.add();
    res.json({ id: job.id });
  } catch (err) {
    console.log(err);
    res.status(500).send('Error creating job');
  }
});

router.post('/pause', async (req, res) => {
  // pause current job using jobId
  const { id } = req.body;
  const pauseQueue = new Queue('pause', conn);
  const taskQueue = new Queue('tasks', conn);
  try {
    const pauseJob = await taskQueue.getJob(id);
    if (pauseJob == null) return res.status(500).send("Job doesn't exist");

    const newJob = await pauseQueue.add({}, { jobId: id });
    res.json({ id: newJob.id });
  } catch (err) {
    console.log(err);
    res.status(500).send('Could not add to pause queue');
  }
});

router.post('/resume', async (req, res) => {
  // resume current job using jobId
  const { id } = req.body;
  const pauseQueue = new Queue('pause', conn);
  try {
    const pauseJob = await pauseQueue.getJob(id);
    if (pauseJob == null) return res.status(500).send("Job doesn't exist");

    await pauseJob.moveToCompleted(`Job ${id} resumed`, true, true);
    res.json({ id: pauseJob.id });
  } catch (err) {
    console.log(err);
    res.status(500).send('Error resuming job');
  }
});

router.post('/terminate', async (req, res) => {
  // terminate current job using jobId
  const { id } = req.body;
  const stopQueue = new Queue('stop', conn);
  const taskQueue = new Queue('tasks', conn);
  try {
    const stopJob = await taskQueue.getJob(id);
    if (stopJob == null) return res.status(500).send("Job doesn't exist");

    const newJob = await stopQueue.add({}, { jobId: stopJob.id });
    res.send({ id: newJob.id });
  } catch (err) {
    console.log(err);
    res.status(500).send();
  }
});

router.post('/:jobId', async (req, res) => {
  // TODO: get status of job from jobId
});

module.exports = router;
