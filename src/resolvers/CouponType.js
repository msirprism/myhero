function coupons(parent, args, context) {
    return context.prisma.couponType.findOne({where: {id: parent.id}}).coupon()
}
  
module.exports = {
    coupons
}