const tf = require('@tensorflow/tfjs'); 
const fs = require('fs');
const path = require('path');
const { removeStopwords } = require('stopword');

const events = require('./sampleEvents.json');
const users = require('./sampleUsers.json');

// ---- Tokenization ----
let vocabSet = new Set();
function tokenize(text) {
  return removeStopwords(text.toLowerCase().split(/\W+/)).filter(Boolean);
}

events.forEach(e => tokenize(e.description + " " + e.skills.join(" ")).forEach(w => vocabSet.add(w)));
users.forEach(u => tokenize(u.interests || "").forEach(w => vocabSet.add(w)));

const vocab = Array.from(vocabSet).slice(0, 100);
const vocabIndex = Object.fromEntries(vocab.map((w, i) => [w, i]));

fs.mkdirSync(path.join(__dirname, 'model'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'model', 'tfidf_vectorizer_vocab.json'), JSON.stringify(vocabIndex, null, 2));

function vectorize(text) {
  const vec = new Array(vocab.length).fill(0);
  tokenize(text).forEach(word => {
    if (vocabIndex[word] !== undefined) vec[vocabIndex[word]] = 1;
  });
  return vec;
}

let X = [], y = [];
users.forEach(user => {
  events.forEach(event => {
    const uVec = vectorize(user.interests || "");
    const eVec = vectorize(event.description + " " + event.skills.join(" "));
    X.push(uVec.concat(eVec));

    const overlap = event.skills.some(skill =>
      (user.interests || "").toLowerCase().includes(skill.toLowerCase())
    );
    y.push(overlap ? 1 : 0);
  });
});

const xs = tf.tensor2d(X);
const ys = tf.tensor2d(y, [y.length, 1]);

// ---- Model ----
const model = tf.sequential();
model.add(tf.layers.dense({ inputShape: [X[0].length], units: 64, activation: 'relu' }));
model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

model.compile({ optimizer: 'adam', loss: 'binaryCrossentropy', metrics: ['accuracy'] });

(async () => {
  console.log("📊 Training model...");
  await model.fit(xs, ys, { epochs: 20, batchSize: 16, validationSplit: 0.1 });

  // Save architecture
  fs.writeFileSync(path.join(__dirname, "model", "model_architecture.json"), JSON.stringify(model.toJSON(), null, 2));

  // Save weights
  const weights = await Promise.all(model.getWeights().map(w => w.array()));
  fs.writeFileSync(path.join(__dirname, "model", "model_weights.json"), JSON.stringify(weights));

  console.log("✅ Model trained & saved as JSON in /model folder");
})();
