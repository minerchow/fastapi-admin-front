import { useCallback, useEffect, useState } from "react";
import { Button, Card, Checkbox, Modal, Spin, Table, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { assignUserRoles, getUserList } from "@/api/user";
import { getAllRoles } from "@/api/role";
import type { RoleItem } from "@/types/role";
import type { UserInfo } from "@/types/user";

const List = () => {
  const [data, setData] = useState<UserInfo[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  const [assignTarget, setAssignTarget] = useState<UserInfo | null>(null);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = useCallback(async (page: number, pageSize: number) => {
    setLoading(true);
    try {
      const res = await getUserList({ page, page_size: pageSize });
      if (res.code === 200 && res.data) {
        setData(res.data.items);
        setTotal(res.data.total);
      } else {
        message.error(res.message || "获取用户列表失败");
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || "获取用户列表失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(page, pageSize);
  }, [page, pageSize, fetchUsers]);

  const openAssignModal = async (user: UserInfo) => {
    setAssignTarget(user);
    setSelectedRoleIds(user.roles.map((role) => role.id));
    setRolesLoading(true);
    try {
      const res = await getAllRoles();
      if (res.code === 200 && res.data) {
        setRoles(res.data);
      } else {
        message.error(res.message || "获取角色列表失败");
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || "获取角色列表失败");
    } finally {
      setRolesLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!assignTarget) return;
    setSubmitting(true);
    try {
      const res = await assignUserRoles(assignTarget.id, {
        role_ids: selectedRoleIds,
      });
      if (res.code === 200) {
        message.success("分配角色成功");
        setAssignTarget(null);
        fetchUsers(page, pageSize);
      } else {
        message.error(res.message || "分配角色失败");
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || "分配角色失败");
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnsType<UserInfo> = [
    { title: "ID", dataIndex: "id", width: 80 },
    { title: "用户名", dataIndex: "username" },
    {
      title: "昵称",
      dataIndex: "nickname",
      render: (nickname?: string | null) => nickname || "-",
    },
    {
      title: "角色",
      dataIndex: "roles",
      render: (_, record) =>
        record.roles.length > 0
          ? record.roles.map((role) => <Tag key={role.id}>{role.name}</Tag>)
          : "-",
    },
    {
      title: "操作",
      width: 120,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          onClick={() => openAssignModal(record)}
        >
          分配角色
        </Button>
      ),
    },
  ];

  return (
    <div className="users-list-page">
      <Card title="用户列表">
        <Table<UserInfo>
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
        title={`分配角色 - ${assignTarget?.username ?? ""}`}
        open={!!assignTarget}
        confirmLoading={submitting}
        onOk={handleAssign}
        onCancel={() => setAssignTarget(null)}
        destroyOnClose
      >
        <Spin spinning={rolesLoading}>
          <Checkbox.Group
            value={selectedRoleIds}
            onChange={(values) => setSelectedRoleIds(values as number[])}
            options={roles.map((role) => ({
              label: role.name,
              value: role.id,
            }))}
          />
        </Spin>
      </Modal>
    </div>
  );
};
export default List;
