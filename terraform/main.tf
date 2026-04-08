provider "aws" {
  region = "us-east-1"
}

# -------------------
# VPC
# -------------------
resource "aws_vpc" "main_devops_vpc" {
  cidr_block = "10.0.0.0/16"

  tags = {
    Name = "main_devops-vpc"
  }
}

# -------------------
# Public subnets (for IGW & NAT)
# -------------------
resource "aws_subnet" "main_devops_public_subnet" {
  count                   = 2
  vpc_id                  = aws_vpc.main_devops_vpc.id
  cidr_block              = cidrsubnet(aws_vpc.main_devops_vpc.cidr_block, 8, count.index)
  availability_zone       = element(["us-east-1a", "us-east-1b"], count.index)
  map_public_ip_on_launch = true

  tags = {
    Name = "main_devops-public-${count.index}"
  }
}

# -------------------
# Private subnets (for worker nodes)
# -------------------
resource "aws_subnet" "main_devops_private_subnet" {
  count             = 2
  vpc_id            = aws_vpc.main_devops_vpc.id
  cidr_block        = cidrsubnet(aws_vpc.main_devops_vpc.cidr_block, 8, count.index + 2)
  availability_zone = element(["us-east-1a", "us-east-1b"], count.index)

  tags = {
    Name = "main_devops-private-${count.index}"
  }
}

# -------------------
# Internet Gateway
# -------------------
resource "aws_internet_gateway" "main_devops_igw" {
  vpc_id = aws_vpc.main_devops_vpc.id

  tags = {
    Name = "main_devops-igw"
  }
}

# -------------------
# Public Route Table
# -------------------
resource "aws_route_table" "main_devops_public_rt" {
  vpc_id = aws_vpc.main_devops_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main_devops_igw.id
  }

  tags = {
    Name = "main_devops-public-rt"
  }
}

resource "aws_route_table_association" "public_assoc" {
  count          = 2
  subnet_id      = aws_subnet.main_devops_public_subnet[count.index].id
  route_table_id = aws_route_table.main_devops_public_rt.id
}

# -------------------
# NAT Gateways
# -------------------
resource "aws_eip" "nat_eip" {
  count = 2

  tags = {
    Name = "main_devops-nat-eip-${count.index}"
  }
}

resource "aws_nat_gateway" "main_devops_nat" {
  count         = 2
  allocation_id = aws_eip.nat_eip[count.index].id
  subnet_id     = aws_subnet.main_devops_public_subnet[count.index].id

  tags = {
    Name = "main_devops-nat-${count.index}"
  }
}

# -------------------
# Private Route Tables (for private subnets)
# -------------------
resource "aws_route_table" "main_devops_private_rt" {
  count  = 2
  vpc_id = aws_vpc.main_devops_vpc.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main_devops_nat[count.index].id
  }

  tags = {
    Name = "main_devops-private-rt-${count.index}"
  }
}

resource "aws_route_table_association" "private_assoc" {
  count          = 2
  subnet_id      = aws_subnet.main_devops_private_subnet[count.index].id
  route_table_id = aws_route_table.main_devops_private_rt[count.index].id
}

# -------------------
# Security Groups
# -------------------
# Cluster SG (used for both control plane and worker nodes)
resource "aws_security_group" "main_devops_cluster_sg" {
  vpc_id = aws_vpc.main_devops_vpc.id

  # Allow all outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "main_devops-cluster-sg"
  }
}

resource "aws_security_group" "main_devops_node_sg" {
  vpc_id = aws_vpc.main_devops_vpc.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["YOUR_PUBLIC_IP/32"]
  }
  # cidr_blocks = ["YOUR_PUBLIC_IP/32"]
  # this is the best practice using 
  # your public ip is the laptop ip

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "main_devops-node-sg"
  }
}


# -------------------
# IAM Roles
# -------------------
resource "aws_iam_role" "main_devops_cluster_role" {
  name = "main_devops-cluster-role"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "eks.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "main_devops_cluster_policy" {
  role       = aws_iam_role.main_devops_cluster_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
}

resource "aws_iam_role" "main_devops_node_group_role" {
  name = "main_devops-node-group-role"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "ec2.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "main_devops_node_worker" {
  role       = aws_iam_role.main_devops_node_group_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
}

resource "aws_iam_role_policy_attachment" "main_devops_node_cni" {
  role       = aws_iam_role.main_devops_node_group_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
}

resource "aws_iam_role_policy_attachment" "main_devops_node_ecr" {
  role       = aws_iam_role.main_devops_node_group_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

resource "aws_iam_role_policy_attachment" "main_devops_node_ebs" {
  role       = aws_iam_role.main_devops_node_group_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy"
}

# -------------------
# EKS Cluster
# -------------------
resource "aws_eks_cluster" "main_devops" {
  name     = "main_devops-cluster"
  role_arn = aws_iam_role.main_devops_cluster_role.arn

  vpc_config {
    subnet_ids         = aws_subnet.main_devops_private_subnet[*].id
    security_group_ids = [aws_security_group.main_devops_cluster_sg.id]
  }

  depends_on = [aws_iam_role_policy_attachment.main_devops_cluster_policy]
}

resource "aws_eks_addon" "ebs_csi_driver" {
  cluster_name                = aws_eks_cluster.main_devops.name
  addon_name                  = "aws-ebs-csi-driver"
  resolve_conflicts_on_create = "OVERWRITE"
  resolve_conflicts_on_update = "OVERWRITE"
}

# -------------------
# EKS Node Group
# -------------------
resource "aws_eks_node_group" "main_devops" {
  cluster_name    = aws_eks_cluster.main_devops.name
  node_group_name = "main_devops-node-group"
  node_role_arn   = aws_iam_role.main_devops_node_group_role.arn
  subnet_ids      = aws_subnet.main_devops_private_subnet[*].id

  scaling_config {
    desired_size = 3
    max_size     = 5
    min_size     = 2
  }

  instance_types = ["t3.medium"]

  # Use only the cluster security group for nodes
  remote_access {
    ec2_ssh_key               = var.ssh_key_name
    source_security_group_ids = [aws_security_group.main_devops_node_sg.id]
  }
  depends_on = [aws_eks_cluster.main_devops]
}
