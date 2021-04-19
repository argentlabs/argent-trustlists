const path = require("path");
module.exports = {
  webpack: {
    alias: {
      '@metadata': path.resolve(__dirname, `./src/${process.env.REACT_APP_METADATA_FILE}`)
    }
  }
}