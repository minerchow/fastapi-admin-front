import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Table,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  createPermission,
  deletePermission,
  getPermissionList,
  updatePermission,
} from "@/api/permission";
import type { PermissionItem } from "@/types/permission";

interface PermissionFormValues {
  code: string;
  name: string;
  description?: string | null;
}

const List = () => {
  const [data, setData] = useState<PermissionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingPermission, setEditingPermission] =
    useState<PermissionItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<PermissionFormValues>();

  const fetchPermissions = useCallback(
    async (page: number, pageSize: number) => {
      setLoading(true);
      try {
        const res = await getPermissionList({ page, page_size: pageSize });
        if (res.code === 200 && res.data) {
          setData(res.data.items);
          setTotal(res.data.total);
        } else {
          message.error(res.message || "获取权限列表失败");
        }
      } catch (error: any) {
        message.error(error?.response?.data?.message || "获取权限列表失败");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchPermissions(page, pageSize);
  }, [page, pageSize, fetchPermissions]);

  // 弹窗销毁后重新挂载时，Form 会按当前 editingPermission 的 initialValues 初始化。
  const openCreateModal = () => {
    setEditingPermission(null);
    setFormOpen(true);
  };

  const openEditModal = (permission: PermissionItem) => {
    setEditingPermission(permission);
    setFormOpen(true);
  };

  const closeFormModal = () => setFormOpen(false);

  const handleFormSubmit = async () => {
    let values: PermissionFormValues;
    try {
      values = await form.validateFields();
    } catch {
      // 表单校验未通过，antd 已在字段上显示错误
      return;
    }

    setSubmitting(true);
    try {
      const res = editingPermission
        ? await updatePermission(editingPermission.id, {
            code: values.code,
            name: values.name,
            description: values.description || null,
          })
        : await createPermission({
            code: values.code,
            name: values.name,
            description: values.description || null,
          });
      if (res.code === 200) {
        message.success(editingPermission ? "更新权限成功" : "创建权限成功");
        closeFormModal();
        fetchPermissions(page, pageSize);
      } else {
        message.error(res.message || "保存权限失败");
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || "保存权限失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (permission: PermissionItem) => {
    try {
      const res = await deletePermission(permission.id);
      if (res.code === 200) {
        message.success("删除权限成功");
        fetchPermissions(page, pageSize);
      } else {
        message.error(res.message || "删除权限失败");
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || "删除权限失败");
    }
  };

  const columns: ColumnsType<PermissionItem> = [
    { title: "ID", dataIndex: "id", width: 80 },
    { title: "编码", dataIndex: "code" },
    { title: "名称", dataIndex: "name" },
    {
      title: "描述",
      dataIndex: "description",
      render: (description?: string | null) => description || "-",
    },
    {
      title: "操作",
      width: 140,
      render: (_, record) => (
        <>
          <Button
            type="link"
            size="small"
            onClick={() => openEditModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="删除权限"
            description="已分配该权限的角色将失去对应权限，确认删除？"
            okText="删除"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record)}
          >
            <Button type="link" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  return (
    <div className="permissions-list-page">
      <Card
        title="权限列表"
        extra={
          <Button type="primary" onClick={openCreateModal}>
            新增权限
          </Button>
        }
      >
        <Table<PermissionItem>
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage);
              setPageSize(nextPageSize);
            },
          }}
        />
      </Card>
      <Modal
        title={
          editingPermission
            ? `编辑权限 - ${editingPermission.name}`
            : "新增权限"
        }
        open={formOpen}
        confirmLoading={submitting}
        onOk={handleFormSubmit}
        onCancel={closeFormModal}
        destroyOnClose
      >
        <Form
          key={editingPermission?.id ?? "new"}
          form={form}
          layout="vertical"
          preserve={false}
          initialValues={{
            code: editingPermission?.code,
            name: editingPermission?.name,
            description: editingPermission?.description ?? "",
          }}
        >
          <Form.Item
            label="权限编码"
            name="code"
            extra="后端按编码鉴权，修改已存在的编码会使已分配的角色失效"
            rules={[
              { required: true, message: "请输入权限编码" },
              { max: 100, message: "权限编码不能超过 100 个字符" },
              {
                pattern: /^[a-z][a-z0-9]*(:[a-z0-9_]+)+$/,
                message: "编码格式应为 module:action，如 role:read",
              },
            ]}
          >
            <Input placeholder="如 role:assign_permission" maxLength={100} />
          </Form.Item>
          <Form.Item
            label="权限名称"
            name="name"
            rules={[
              { required: true, message: "请输入权限名称" },
              { max: 100, message: "权限名称不能超过 100 个字符" },
            ]}
          >
            <Input placeholder="如 分配权限" maxLength={100} />
          </Form.Item>
          <Form.Item
            label="描述"
            name="description"
            rules={[{ max: 200, message: "描述不能超过 200 个字符" }]}
          >
            <Input.TextArea
              placeholder="权限用途说明"
              maxLength={200}
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default List;
