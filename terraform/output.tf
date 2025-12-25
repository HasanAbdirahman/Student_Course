output "cluster_id" {
  value = aws_eks_cluster.main_devops
}

output "node_group_id" {
  value = aws_eks_node_group.main_devopsaws_eks_cluster.main_devops
}

output "vpc_id" {
  value = aws_vpc.main_devopsaws_eks_cluster.main_devops_vpc.id
}

output "subnet_ids" {
  value = aws_subnet.main_devopsaws_eks_cluster.main_devops_subnet[*].id
}
