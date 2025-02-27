const render404 = (err,req,res,next)=>{
    console.log(`error occur server errror${err}`)
    return res.render("404")

}

export default{
    render404
}