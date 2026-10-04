import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Switch,
  Table,
  Tag,
  TreeSelect,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { createMenu, deleteMenu, getMenuTree, updateMenu } from "@/api/menu";
import { getAllPermissions } from "@/api/permission";
import { collectMenuablePaths } from "@/config/routePaths";
import { groupLabel, groupPermissions } from "@/config/permissionGroup";
import { useStore } from "@/store";
import type { PermissionItem } from "@/types/permission";
import type { MenuCreateBody, MenuTreeNode } from "@/types/menu";

interface MenuFormValues {
  name: string;
  path: string;
  parent_id?: number;
  permission_id?: number;
  sort_order?: number;
  is_visible: boolean;
}

interface TreeOption {
  title: string;
  value: number;
  children?: TreeOption[];
}

// 表格行：叶子节点的 children 归一成 undefined。
// 后端叶子给的是 children: []，antd Table 见到数组就渲染展开箭头，
// rowExpandable 也拦不住那个箭头，点下去还会撑出一行空白。
type MenuRow = Omit<MenuTreeNode, "children"> & { children?: MenuRow[] };

const toTableRows = (nodes: MenuTreeNode[]): MenuRow[] =>
  nodes.map((node) => ({
    ...node,
    children: node.children.length ? toTableRows(node.children) : undefined,
  }));

// 每次拉到新树都把全部父节点展开，否则受控 expandedRowKeys 会让子树在刷新后突然收起
const collectParentIds = (nodes: MenuTreeNode[]): number[] => {
  const ids: number[] = [];
  const walk = (list: MenuTreeNode[]) => {
    for (const node of list) {
      if (node.children && node.children.length > 0) {
        ids.push(node.id);
        walk(node.children);
      }
    }
  };
  walk(nodes);
  return ids;
};

// 返回自身与全部后代的 id，编辑时用来把「自己 + 子树」从上级候选里剪掉。
// 后端 validate_parent_placement 才是权威，这里只是少让 admin 点错一次。
const collectSubtreeIds = (
  nodes: MenuTreeNode[],
  targetId: number
): Set<number> => {
  const found = new Set<number>();
  const find = (list: MenuTreeNode[]): MenuTreeNode[] | null => {
    for (const node of list) {
      if (node.id === targetId) return [node];
      if (node.children?.length) {
        const hit = find(node.children);
        if (hit) return hit;
      }
    }
    return null;
  };
  const mark = (list: MenuTreeNode[]) => {
    for (const node of list) {
      found.add(node.id);
      if (node.children?.length) mark(node.children);
    }
  };
  const subtree = find(nodes);
  if (subtree) mark(subtree);
  return found;
};

const buildTreeOptions = (
  nodes: MenuTreeNode[],
  excluded: Set<number>
): TreeOption[] =>
  nodes
    .filter((node) => !excluded.has(node.id))
    .map((node) => ({
      title: `${node.name}（${node.path}）`,
      value: node.id,
      children: node.children?.length
        ? buildTreeOptions(node.children, excluded)
        : undefined,
    }));

const List = () => {
  const { menuStore } = useStore();
  const [tree, setTree] = useState<MenuTreeNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedRowKeys, setExpandedRowKeys] = useState<number[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuRow | null>(null);
  // 「新增子菜单」预填的父节点，仅在新增态生效
  const [presetParentId, setPresetParentId] = useState<number | undefined>(
    undefined
  );
  const [submitting, setSubmitting] = useState(false);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [form] = Form.useForm<MenuFormValues>();

  const fetchTree = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMenuTree();
      if (res.code === 200 && res.data) {
        setTree(res.data);
        setExpandedRowKeys(collectParentIds(res.data));
      } else {
        message.error(res.message || "获取菜单树失败");
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || "获取菜单树失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  const loadPermissions = async () => {
    try {
      const res = await getAllPermissions();
      if (res.code === 200 && res.data) setPermissions(res.data);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "获取权限列表失败");
    }
  };

  const openCreateModal = (parentId?: number) => {
    setEditingMenu(null);
    setPresetParentId(parentId);
    setFormOpen(true);
    loadPermissions();
  };

  const openEditModal = (menu: MenuRow) => {
    setEditingMenu(menu);
    setPresetParentId(undefined);
    setFormOpen(true);
    loadPermissions();
  };

  const closeFormModal = () => setFormOpen(false);

  // 写成功之后同时刷新左侧导航，改动当场生效，不用刷新页面
  const afterMutation = async () => {
    await fetchTree();
    menuStore.refreshNav();
  };

  const handleFormSubmit = async () => {
    let values: MenuFormValues;
    try {
      values = await form.validateFields();
    } catch {
      // 表单校验未通过，antd 已在字段上显示错误
      return;
    }

    // 提交体始终全量：后端 Update 是 exclude_unset 语义，
    // 想「提升为根」或「解除权限绑定」必须显式发 null，不传等于不改。
    const body: MenuCreateBody = {
      name: values.name,
      path: values.path,
      parent_id: values.parent_id ?? null,
      permission_id: values.permission_id ?? null,
      sort_order: values.sort_order ?? 0,
      is_visible: values.is_visible,
    };

    setSubmitting(true);
    try {
      const res = editingMenu
        ? await updateMenu(editingMenu.id, body)
        : await createMenu(body);
      if (res.code === 200) {
        message.success(editingMenu ? "更新菜单成功" : "创建菜单成功");
        closeFormModal();
        await afterMutation();
      } else {
        message.error(res.message || "保存菜单失败");
      }
    } catch (error: any) {
      // 400「菜单路径已存在」「存在子菜单，无法删除」「菜单层级不能超过 3 级」
      // 这类文案由后端 HTTPException 的 detail 经全局异常处理器放进 message
      message.error(error?.response?.data?.message || "保存菜单失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (menu: MenuRow) => {
    try {
      const res = await deleteMenu(menu.id);
      if (res.code === 200) {
        message.success("删除菜单成功");
        await afterMutation();
      } else {
        message.error(res.message || "删除菜单失败");
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || "删除菜单失败");
    }
  };

  const registeredPaths = collectMenuablePaths();
  // 编辑历史菜单时，当前 path 可能已不在路由表里，并入候选避免下拉回显成空
  const pathOptions = Array.from(
    new Set(
      editingMenu && !registeredPaths.includes(editingMenu.path)
        ? [editingMenu.path, ...registeredPaths]
        : registeredPaths
    )
  ).map((path) => ({
    value: path,
    label: path,
  }));

  const parentOptions = buildTreeOptions(
    tree,
    editingMenu ? collectSubtreeIds(tree, editingMenu.id) : new Set<number>()
  );

  const groupedPermissions = groupPermissions(permissions);

  const tableRows = toTableRows(tree);

  const columns: ColumnsType<MenuRow> = [
    { title: "ID", dataIndex: "id", width: 80 },
    { title: "名称", dataIndex: "name" },
    { title: "路由路径", dataIndex: "path" },
    {
      title: "绑定权限",
      dataIndex: "permission_code",
      render: (_, record) => {
        if (record.permission_id === null) {
          return <span style={{ color: "#999" }}>全部登录用户</span>;
        }
        // 绑了 permission_id 却取不到 code = 该权限已被软删除，导航里按隐藏处理
        if (!record.permission_code) {
          return <Tag color="red">绑定的权限已删除</Tag>;
        }
        return <Tag>{record.permission_code}</Tag>;
      },
    },
    { title: "排序", dataIndex: "sort_order", width: 80 },
    {
      title: "可见",
      dataIndex: "is_visible",
      width: 90,
      render: (isVisible: boolean) =>
        isVisible ? (
          <Tag color="green">显示</Tag>
        ) : (
          <Tag color="default">隐藏</Tag>
        ),
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
            onClick={() => openCreateModal(record.id)}
          >
            新增子菜单
          </Button>
          <Popconfirm
            title="删除菜单"
            description="存在子菜单时会被后端拒绝，需先删除子菜单，确认删除？"
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
    <div className="menus-list-page">
      <Card
        title="菜单树"
        extra={
          <Button type="primary" onClick={() => openCreateModal()}>
            新增根菜单
          </Button>
        }
      >
        <Table<MenuRow>
          rowKey="id"
          columns={columns}
          dataSource={tableRows}
          loading={loading}
          pagination={false}
          expandable={{
            expandedRowKeys,
            onExpandedRowsChange: (keys) =>
              setExpandedRowKeys(keys as number[]),
          }}
        />
      </Card>
      <Modal
        title={editingMenu ? `编辑菜单 - ${editingMenu.name}` : "新增菜单"}
        open={formOpen}
        confirmLoading={submitting}
        onOk={handleFormSubmit}
        onCancel={closeFormModal}
        destroyOnClose
      >
        <Form
          key={editingMenu?.id ?? `new-${presetParentId ?? "root"}`}
          form={form}
          layout="vertical"
          preserve={false}
          initialValues={{
            name: editingMenu?.name,
            path: editingMenu?.path,
            parent_id: editingMenu?.parent_id ?? presetParentId,
            permission_id: editingMenu?.permission_id,
            sort_order: editingMenu?.sort_order ?? 0,
            is_visible: editingMenu?.is_visible ?? true,
          }}
        >
          <Form.Item
            label="菜单名称"
            name="name"
            rules={[
              { required: true, message: "请输入菜单名称" },
              { max: 50, message: "菜单名称不能超过 50 个字符" },
            ]}
          >
            <Input placeholder="如 菜单管理" maxLength={50} />
          </Form.Item>
          <Form.Item
            label="路由路径"
            name="path"
            extra="只能选前端已注册的路由；新页面仍需先在 routes.tsx 注册"
            rules={[{ required: true, message: "请选择路由路径" }]}
          >
            <Select
              placeholder="选择菜单指向的前端路由"
              options={pathOptions}
              showSearch
            />
          </Form.Item>
          <Form.Item
            label="上级菜单"
            name="parent_id"
            extra="留空表示根菜单；层级最多 3 级，超出会被后端拒绝"
          >
            <TreeSelect
              allowClear
              placeholder="不选即为根菜单"
              treeData={parentOptions}
              treeDefaultExpandAll
            />
          </Form.Item>
          <Form.Item
            label="绑定权限"
            name="permission_id"
            extra="留空 = 所有登录用户可见；绑定后仅持有该权限码的用户可见，子菜单全不可见时父菜单会被裁掉"
          >
            <Select
              allowClear
              showSearch
              placeholder="不绑定权限"
              optionFilterProp="label"
              options={Object.entries(groupedPermissions).map(
                ([group, items]) => ({
                  label: groupLabel(group),
                  options: items.map((item) => ({
                    label: `${item.name}（${item.code}）`,
                    value: item.id,
                  })),
                })
              )}
            />
          </Form.Item>
          <Form.Item
            label="同级排序"
            name="sort_order"
            extra="升序，并列时按 ID 排序"
          >
            <InputNumber min={0} precision={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            label="是否显示"
            name="is_visible"
            valuePropName="checked"
            extra="手动开关，与权限绑定相互独立，任一为假即隐藏"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default List;
