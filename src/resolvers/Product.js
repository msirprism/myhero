function merchant(parent, args, context) {
  return context.prisma.product.findOne({where: {id: parent.id}}).merchant_merchantToproduct()
}

function productCategories(parent, args, context) {
  return context.prisma.product.findOne({where: {id: parent.id}}).productCategory()
}

function productAddons(parent, args, context) {
  return context.prisma.product.findOne({where: {id: parent.id}}).productAddon()
}

function productSizes(parent, args, context) {
  return context.prisma.product.findOne({where: {id: parent.id}}).productSize()
}

function totalAddons(parent, args, context) {
	return context.prisma.productAddon.count({
		where: {
			product: parent.id,
			addon_addonToproductAddon: {
				AND: [
		            {active: true}
		        ]
			}
		}
	});
}

function hasProductSize(parent, args, context) {
	return context.prisma.productSize.count({
		where: {
			product: parent.id,
			active: true
			/*product_productToproductSize: {
				AND: [
		            {active: true}
		        ]
			}*/
		}
	});
}

function totalAvailableProductSize(parent, args, context) {
	return context.prisma.productSize.count({
		where: {
			product: parent.id,
			isAvailable: true,
			active: true
			/*product_productToproductSize: {
				AND: [
					{isAvailable: true},
		            {active: true}
		        ]
			}*/
		}
	});
}

function totalAvailableAddons(parent, args, context) {
	return context.prisma.productAddon.count({
		where: {
			product: parent.id,
			addon_addonToproductAddon: {
				AND: [
					{isAvailable: true},
		            {active: true}
		        ]
			}
		}
	});
}


module.exports = {
  merchant,
  productCategories,
  productAddons,
  productSizes,
  hasProductSize,
  totalAddons,
  totalAvailableProductSize,
  totalAvailableAddons,
}
