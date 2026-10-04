import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Card,
  Checkbox,
  Form,
  Input,
  Modal,
  Popconfirm,
  Spin,
  Table,
  Tag,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  assignRolePermissions,
  createRole,
  deleteRole,
  getRoleList,
  updateRole,
} from "@/api/role";
import { getAllPermissions } from "@/api/permission";
import { groupLabel, groupPermissions } from "@/config/permissionGroup";
import type { PermissionItem } from "@/types/permission";
import type { RoleItem } from "@/types/role";

interface RoleFormValues {
  name: string;
  description?: string | null;
}

const List = () => {
  const [data, setData] = useState<RoleItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  // 新增/编辑角色
  const [formOpen, setFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<RoleFormValues>();

  // 分配权限
  const [assignTarget, setAssignTarget] = useState<RoleItem | null>(null);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>(
    []
  );
  const [assigning, setAssigning] = useState(false);

  const fetchRoles = useCallback(async (page: number, pageSize: number) => {
    setLoading(true);
    try {
      const res = await getRoleList({ page, page_size: pageSize });
      if (res.code === 200 && res.data) {
        setData(res.data.items);
        setTotal(res.data.total);
      } else {
        message.error(res.message || "获取角色列表失败");
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || "获取角色列表失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles(page, pageSize);
  }, [page, pageSize, fetchRoles]);

  // 弹窗关闭时子组件会被销毁，重新打开时 Form 会用当前 editingRole 的 initialValues
  // 重新挂载，因此不需要在打开前调用 setFieldsValue/resetFields（那会触发未挂载警告）。
  const openCreateModal = () => {
    setEditingRole(null);
    setFormOpen(true);
  };

  const openEditModal = (role: RoleItem) => {
    setEditingRole(role);
    setFormOpen(true);
  };

  const closeFormModal = () => {
    setFormOpen(false);
  };

  const handleFormSubmit = async () => {
    let values: RoleFormValues;
    try {
      values = await form.validateFields();
    } catch {
      // 表单校验未通过，antd 已在字段上显示错误
      return;
    }

    setSubmitting(true);
    try {
      const res = editingRole
        ? await updateRole(editingRole.id, {
            name: values.name,
            description: values.description || null,
          })
        : await createRole({
            name: values.name,
            description: values.description || null,
          });
      if (res.code === 200) {
        message.success(editingRole ? "更新角色成功" : "创建角色成功");
        closeFormModal();
        fetchRoles(page, pageSize);
      } else {
        message.error(res.message || "保存角色失败");
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || "保存角色失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (role: RoleItem) => {
    try {
      const res = await deleteRole(role.id);
      if (res.code === 200) {
        message.success("删除角色成功");
        fetchRoles(page, pageSize);
      } else {
        message.error(res.message || "删除角色失败");
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || "删除角色失败");
    }
  };

  const openAssignModal = async (role: RoleItem) => {
    setAssignTarget(role);
    // 角色列表已带当前权限，直接回填勾选，无需额外请求
    setSelectedPermissionIds((role.permissions ?? []).map((p) => p.id));
    setPermissionsLoading(true);
    try {
      const res = await getAllPermissions();
      if (res.code === 200 && res.data) {
        setPermissions(res.data);
      } else {
        message.error(res.message || "获取权限列表失败");
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || "获取权限列表失败");
    } finally {
      setPermissionsLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!assignTarget) return;
    setAssigning(true);
    try {
      const res = await assignRolePermissions(
        assignTarget.id,
        selectedPermissionIds
      );
      if (res.code === 200) {
        message.success("分配权限成功");
        setAssignTarget(null);
        fetchRoles(page, pageSize);
      } else {
        message.error(res.message || "分配权限失败");
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || "分配权限失败");
    } finally {
      setAssigning(false);
    }
  };

  const grouped = groupPermissions(permissions);

  const columns: ColumnsType<RoleItem> = [
    { title: "ID", dataIndex: "id", width: 80 },
    { title: "角色名称", dataIndex: "name" },
    {
      title: "描述",
      dataIndex: "description",
      render: (description?: string | null) => description || "-",
    },
    {
      title: "权限",
      dataIndex: "permissions",
      render: (_, record) =>
        record.permissions && record.permissions.length > 0
          ? record.permissions.map((permission) => (
              <Tag key={permission.id}>{permission.name}</Tag>
            ))
          : "-",
    },
    {
      title: "操作",
      width: 220,
      render: (_, record) => (
        <>
          <Button
            type="link"
            size="small"
            onClick={() => openEditModal(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => openAssignModal(record)}
          >
            分配权限
          </Button>
          <Popconfirm
            title="删除角色"
            description="该角色下的用户将失去对应权限，确认删除？"
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
    <div className="roles-list-page">
      <Card
        title="角色列表"
        extra={
          <Button type="primary" onClick={openCreateModal}>
            新增角色
          </Button>
        }
      >
        <Table<RoleItem>
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
        title={editingRole ? `编辑角色 - ${editingRole.name}` : "新增角色"}
        open={formOpen}
        confirmLoading={submitting}
        onOk={handleFormSubmit}
        onCancel={closeFormModal}
        destroyOnClose
      >
        <Form
          key={editingRole?.id ?? "new"}
          form={form}
          layout="vertical"
          preserve={false}
          initialValues={{
            name: editingRole?.name,
            description: editingRole?.description ?? "",
          }}
        >
          <Form.Item
            label="角色名称"
            name="name"
            rules={[
              { required: true, message: "请输入角色名称" },
              { max: 50, message: "角色名称不能超过 50 个字符" },
            ]}
          >
            <Input placeholder="如 editor" maxLength={50} />
          </Form.Item>
          <Form.Item
            label="描述"
            name="description"
            rules={[{ max: 200, message: "描述不能超过 200 个字符" }]}
          >
            <Input.TextArea
              placeholder="角色用途说明"
              maxLength={200}
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title={`分配权限 - ${assignTarget?.name ?? ""}`}
        open={!!assignTarget}
        confirmLoading={assigning}
        onOk={handleAssign}
        onCancel={() => setAssignTarget(null)}
        width={640}
        destroyOnClose
      >
        <Spin spinning={permissionsLoading}>
          {Object.entries(grouped).map(([group, items]) => {
            const groupIds = new Set(items.map((item) => item.id));
            return (
              <div key={group} style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>
                  {groupLabel(group)}
                </div>
                <Checkbox.Group
                  value={selectedPermissionIds}
                  onChange={(values) =>
                    setSelectedPermissionIds((prev) => [
                      ...prev.filter((id) => !groupIds.has(id)),
                      ...(values as number[]),
                    ])
                  }
                  options={items.map((item) => ({
                    label: `${item.name}（${item.code}）`,
                    value: item.id,
                  }))}
                />
              </div>
            );
          })}
        </Spin>
      </Modal>
    </div>
  );
};

export default List;
