const Router = require('koa-router')

const { Auth } = require('../../../middlewares/auth')
const { Flow } = require('../../models/flow')
const { Art } = require('../../models/art')
const { Favor } = require('../../models/favor')

const router = new Router({
    prefix: '/v1/classic'
})

const { PositiveIntegerValidator, ClassicValidator } = require('../../validators/validator')

router.get('/latest',new Auth(8).m, async (ctx, next) => {
    const flow = await Flow.findOne({
        order: [
            ['index', 'DESC']
        ]
    })
    const art = await Art.getData(flow.artId, flow.type)
    art.setDataValue('index', flow.index)
    ctx.body = art
})

router.get('/:index/next', new Auth().m, async(ctx, next) => {
    const v = await new PositiveIntegerValidator().validate(ctx, {
        id: 'index'
    })

    const index = v.get('path.index')
    const flow = await Flow.findOne({
        where: {
            index: index + 1
        }
    })
    if(!flow) {
        throw new global.errs.NotFound()
    } 
    const art = await Art.getData(flow.artId, flow.type)
    const likeNext = await Favor.userLikeIt(flow.artId, flow.type, ctx.auth.uid)
    art.setDataValue('index', flow.index)
    art.setDataValue('likeStatus', likeNext)
    ctx.body = art
})

router.get('/:index/previous', new Auth().m, async(ctx, next) => {
    const v = await new PositiveIntegerValidator().validate(ctx, {
        id: 'index'
    })

    const index = v.get('path.index')
    const flow = await Flow.findOne({
        where: {
            index: index - 1
        }
    })
    if(!flow) {
        throw new global.errs.NotFound()
    } 
    const art = await Art.getData(flow.artId, flow.type)
    const likePrevious = await Favor.userLikeIt(flow.artId, flow.type, ctx.auth.uid)
    art.setDataValue('index', flow.index)
    art.setDataValue('likeStatus', likePrevious)
    ctx.body = art
})

router.get('/:type/:id', new Auth().m, async ctx => {
    const v = await new ClassicValidator().validate(ctx)
    const id = v.get('path.id')
    const type = parseInt(v.get('path.type'))
   
    const artDetail = await new Art(id, type).getDetail(ctx.auth.uid)

    artDetail.art.setDataValue('likeStatus', artDetail.likeStatus)
    ctx.body = artDetail.art
})

router.get('/:type/:id/favor', new Auth().m, async ctx => {
    const v = await new ClassicValidator().validate(ctx)
    const id = v.get('path.id')
    const type = parseInt(v.get('path.type'))
    
    const artDetail = await new Art(id, type).getDetail(ctx.auth.uid)

    ctx.body = {
        favNums: artDetail.art.favNums,
        likeStatus: artDetail.likeStatus
    }
})

router.get('/favor', new Auth().m, async ctx => {
    const uid = ctx.auth.uid
    ctx.body = await Favor.getMyClassicFavors(uid)
})

module.exports = router;