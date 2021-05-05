function branch(parent, args, context) {
  return context.prisma.expense.findOne({where: {id: parent.id}}).branch_branchToexpense()
}

module.exports = {
	branch
};