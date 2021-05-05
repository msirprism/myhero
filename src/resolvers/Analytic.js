function branch(parent, args, context) {
  return context.prisma.analytic.findOne({where: {id: parent.id}}).branch_branchToanalytic()
}

module.exports = {
	branch
};