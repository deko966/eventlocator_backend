let tokens = []

module.exports = {
    addToken: (token) => {
        tokens.push(token)
    },
    getTokens: ()=>{
        return tokens
    },
    removeToken: (token) => {
        tokens.filter((value, index, tokens) => {
            return value != token
          })
    }
}