const path = require('path');

module.exports = {
  // ...existing code...
  module: {
    rules: [
      // ...existing rules...
      {
        test: /\.js$/,
        enforce: 'pre',
        use: ['source-map-loader'],
        exclude: [
          /node_modules\/html2pdf\.js/
        ],
      },
      // ...existing rules...
    ],
  },
  // ...existing code...
};