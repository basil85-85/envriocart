


const getSalereport = async (req,res) => {
    try {
        return res.render("sale-report")
    } catch (error) {
        console.log(`error occur on the rendering the sale report dure to :${error}`)
        return res.render("pages-404")
    }
}


export default{
    getSalereport,
}