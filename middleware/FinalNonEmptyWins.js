export function finalNonEmptyWins(req, res, next) {
    for(let prop in req.body) {
        if(Array.isArray(req.body[prop])) {
            if(req.body[prop].length === 0){
                req.body[prop] = undefined;
            } else {
                req.body[prop] = req.body[prop][req.body[prop].length - 1]
            }
        }
    }
    next();
}
export default finalNonEmptyWins;