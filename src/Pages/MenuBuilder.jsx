import React, { useEffect, useState, useContext } from "react";
import Header from "@/components/common/Header";
import BottomNav from "@/components/common/BottomNav";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Checkbox } from "@/components/ui/Checkbox";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { MenuStorage } from "@/api/localStorageHelpers/menu";
import { AppContext } from "@/context/AppContext";
import EditAccessRequest from "@/components/common/EditAccessRequest";
import { ChangeRequests } from "@/api/changeRequests";

const DEFAULT_COURSES = ["Course 1", "Course 2", "Course 3"];
const buildEmptySelections = (courseList) =>
  courseList.reduce((acc, c) => ({ ...acc, [c]: [] }), {});

export default function MenuBuilder() {
  const { requiresApproval, editRequest, submitEditRequest, accessLoading, user } = useContext(AppContext);
  const [menuItems, setMenuItems] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [prefixedMenuName, setPrefixedMenuName] = useState("Pre-Fixed Menu");
  const [courses, setCourses] = useState(DEFAULT_COURSES);
  const [courseSelections, setCourseSelections] = useState(
    buildEmptySelections(DEFAULT_COURSES)
  );
  const [menus, setMenus] = useState([]);
  const [selectedMenuId, setSelectedMenuId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [collapsedCourses, setCollapsedCourses] = useState({});

  const categories = Array.from(
    new Set(
      (menuItems || []).map(
        (i) =>
          i.category ||
          i.category_slug ||
          i.menu_categories?.slug ||
          "other"
      )
    )
  )
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  const filteredMenuItems = menuItems.filter((item) => {
    const matchesSearch = (item.name || "")
      .toLowerCase()
      .includes(search.toLowerCase());
    const cat =
      item.category || item.category_slug || item.menu_categories?.slug || "other";
    const matchesCategory = categoryFilter === "all" || cat === categoryFilter;
    return matchesSearch && matchesCategory;
  }).sort((a, b) =>
    (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" })
  );

  useEffect(() => {
    loadMenu();
    loadMenus();
  }, []);

  const loadMenu = async () => {
    try {
      const items = await MenuStorage.getMenuItems();
      setMenuItems(items || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load menu items");
    }
  };

  const loadMenus = async (selectId) => {
    try {
      const menus = await MenuStorage.getPrefixedMenus();
      setMenus(menus || []);
      const idToSelect = selectId ?? selectedMenuId ?? menus?.[0]?.id ?? null;
      if (idToSelect) {
        hydrateForm(idToSelect, menus);
      } else {
        resetForm();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load pre-fixed menus");
    }
  };

  const hydrateForm = (menuId, list = menus) => {
    const m = (list || []).find((x) => x.id === menuId);
    if (!m) {
      resetForm();
      return;
    }
    setSelectedMenuId(m.id);
    setPrefixedMenuName(m.name || "Pre-Fixed Menu");
    const savedCourses = (m.courses || []).map((c) => c.course).filter(Boolean);
    const mergedCourses = savedCourses.length ? savedCourses : DEFAULT_COURSES;
    setCourses(mergedCourses);
    const restored = buildEmptySelections(mergedCourses);
    (m.courses || []).forEach((c) => {
      restored[c.course] = c.items?.map((i) => i.id) || [];
    });
    setCourseSelections(restored);
    setEditMode(false);
  };

  const resetForm = () => {
    setSelectedMenuId(null);
    setPrefixedMenuName("Pre-Fixed Menu");
    setCourses(DEFAULT_COURSES);
    setCourseSelections(buildEmptySelections(DEFAULT_COURSES));
    setEditMode(true);
  };

  const toggleCourseItem = (course, itemId) => {
    setCourseSelections((prev) => {
      const current = new Set((prev && prev[course]) || []);
      if (current.has(itemId)) current.delete(itemId);
      else current.add(itemId);
      return { ...prev, [course]: Array.from(current) };
    });
  };

  const savePrefixedMenu = async () => {
    const itemMap = new Map(menuItems.map((i) => [i.id, i]));
    const built = courses.map((course) => ({
      course,
      items: (courseSelections[course] || [])
        .map((id) => itemMap.get(id))
        .filter(Boolean)
        .map((i) => ({ id: i.id, name: i.name })),
    }));
    const hasAny = built.some((c) => c.items.length > 0);
    if (!hasAny) {
      toast.error("Select at least one item to build the menu");
      return;
    }
    try {
      let saved;
      if (selectedMenuId) {
        if (requiresApproval) {
          const before = menus.find((m) => m.id === selectedMenuId);
          await ChangeRequests.submit({
            user,
            entityType: "prefixed_menu",
            entityId: selectedMenuId,
            action: "update",
            beforeData: before,
            afterData: { name: prefixedMenuName || "Pre-Fixed Menu", courses: built },
          });
          toast.success("Menu update submitted for approval.");
        } else {
          saved = await MenuStorage.updatePrefixedMenu(selectedMenuId, {
            name: prefixedMenuName || "Pre-Fixed Menu",
            courses: built,
          });
          toast.success("Pre-fixed menu updated");
        }
      } else {
        if (requiresApproval) {
          await ChangeRequests.submit({
            user,
            entityType: "prefixed_menu",
            entityId: prefixedMenuName || "Pre-Fixed Menu",
            action: "create",
            beforeData: null,
            afterData: { name: prefixedMenuName || "Pre-Fixed Menu", courses: built },
          });
          toast.success("Menu creation submitted for approval.");
        } else {
          saved = await MenuStorage.savePrefixedMenu({
            name: prefixedMenuName || "Pre-Fixed Menu",
            courses: built,
          });
          toast.success("Pre-fixed menu saved");
        }
      }
      if (!requiresApproval) {
        await loadMenus(saved?.id);
        setEditMode(false);
      } else {
        setEditMode(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save pre-fixed menu");
    }
  };

  const handleDelete = async (id = selectedMenuId) => {
    const targetId = typeof id === "string" ? id : (id && id.id ? id.id : null);
    if (!targetId) return;
    const confirmed = window.confirm("Delete this menu?");
    if (!confirmed) return;
    try {
      const before = menus.find((m) => m.id === targetId);
      if (requiresApproval) {
        await ChangeRequests.submit({
          user,
          entityType: "prefixed_menu",
          entityId: targetId,
          action: "delete",
          beforeData: before || null,
          afterData: null,
        });
        toast.success("Deletion submitted for approval.");
        setEditMode(false);
      } else {
        await MenuStorage.deletePrefixedMenu(targetId);
        toast.success("Menu deleted");
        await loadMenus(null);
        setEditMode(false);
      }
    } catch (err) {
      console.error("Delete menu failed:", err);
      toast.error(`Failed to delete menu${err?.message ? `: ${err.message}` : ""}`);
    }
  };

  const handleRequestAccess = async (reason) => {
    try {
      await submitEditRequest(reason);
      toast.success("Request sent to admins");
    } catch (err) {
      console.error("Request access failed:", err);
      toast.error(err?.message || "Could not submit request");
    }
  };

  const selectedMenu = menus.find((m) => m.id === selectedMenuId) || null;

  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      <Header
        title="Menu Builder"
        subtitle="Create, edit, and manage pre-fixed menus"
      />

      {requiresApproval && !accessLoading && (
        <div className="p-4 pt-3">
          <EditAccessRequest
            request={editRequest}
            onSubmit={handleRequestAccess}
            message="Only admins can change pre-fixed menus. Submit a request if you need to update or delete menus."
          />
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Menus List */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Saved Menus</h3>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={() => { resetForm(); setSelectedMenuId(null); }}
              >
                New Menu
              </Button>
              <span className="text-stone-300">|</span>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDelete}
                disabled={!selectedMenuId}
              >
                Delete
              </Button>
            </div>
          </div>
          {menus.length === 0 ? (
            <p className="text-sm text-stone-500">No menus yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {menus.map((m) => (
                <button
                  key={m.id}
                  onClick={() => hydrateForm(m.id)}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left ${
                    selectedMenuId === m.id
                      ? "border-amber-400 bg-amber-100 text-black"
                      : "border-stone-200 hover-border-stone-300"
                  }`}
                >
                  <span className="flex items-center gap-2 min-w-0 flex-1">
                    <span className={`font-medium text-sm truncate ${selectedMenuId === m.id ? "text-black" : ""}`}>
                      {m.name || "Untitled Menu"}
                    </span>
                    <span className={`text-xs ${selectedMenuId === m.id ? "text-black" : "text-stone-500"}`}>
                      {(m.courses || []).length} courses
                    </span>
                  </span>
                  {selectedMenuId === m.id ? (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); handleDelete(m.id); }}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleDelete(m.id); } }}
                      className="p-1 rounded-full text-red-600 hover:text-red-800 cursor-pointer"
                      aria-label="Delete menu"
                    >
                      <Trash2 className="h-4 w-4" />
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Builder Form (Edit Mode) */}
        {editMode && (
          <div className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={prefixedMenuName}
                onChange={(e) => setPrefixedMenuName(e.target.value)}
                placeholder="e.g., Chef's Tasting Menu"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Search Items</Label>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search menu items..."
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Filter by Category</Label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full rounded-xl border border-stone-200 px-3 py-2 bg-white text-stone-900"
              >
                <option value="all">All</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between mt-6 mb-2">
              <h3 className="text-lg font-semibold text-stone-800">Courses</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const nextNumber = courses.length + 1;
                  const candidate = `Course ${nextNumber}`;
                  const newCourseName = courses.includes(candidate)
                    ? `Course ${Date.now()}`
                    : candidate;
                  setCourses((prev) => [...prev, newCourseName]);
                  setCourseSelections((prev) => ({
                    ...prev,
                    [newCourseName]: [],
                  }));
                }}
              >
                + Add Course
              </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {courses.map((course) => (
                <div key={course} className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <button
                    type="button"
                    onClick={() =>
                      setCollapsedCourses((prev) => ({ ...prev, [course]: !prev[course] }))
                    }
                    className="w-full flex items-center justify-between text-sm font-semibold mb-2"
                  >
                    <span>{course}</span>
                    <span className="text-xs text-stone-500">
                      {(courseSelections[course] || []).length} selected
                    </span>
                  </button>
                  {!collapsedCourses[course] && (
                    <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                      {filteredMenuItems.map((item) => {
                        const checked = (courseSelections[course] || []).includes(item.id);
                        return (
                          <label
                            key={`${course}-${item.id}`}
                            className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer hover:bg-white rounded-lg px-2 py-1 transition-colors"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => {
                                toggleCourseItem(course, item.id);
                              }}
                            />
                            <span className="flex-1 truncate">{item.name}</span>
                          </label>
                        );
                      })}
                      {menuItems.length === 0 && (
                        <p className="text-xs text-stone-500">No menu items available.</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  resetForm();
                }}
              >
                Reset
              </Button>
              <Button
                onClick={savePrefixedMenu}
                className="bg-amber-700 hover:bg-amber-800"
              >
                {selectedMenuId ? "Update" : "Save Pre-Fixed Menu"}
              </Button>
            </div>
          </div>
        )}

        {/* Selected Menu Details */}
        {selectedMenu && (
          <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{selectedMenu.name || "Pre-Fixed Menu"}</h3>
              <span className="text-xs text-stone-500">{(selectedMenu.courses || []).length} courses</span>
            </div>
            <div className="space-y-3">
              {(selectedMenu.courses || []).map(({ course, items }) => (
                <div key={course}>
                  <p className="text-sm font-semibold text-stone-800">{course}</p>
                  {items.length === 0 ? (
                    <p className="text-xs text-stone-500">No items selected.</p>
                  ) : (
                    <ul className="mt-1 text-sm text-stone-700 list-disc list-inside space-y-1">
                      {items.map((it) => (
                        <li key={it.id}>{it.name}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
            {!editMode && (
              <div className="flex justify-end mt-3">
                <Button
                  size="lg"
                  onClick={() => {
                    hydrateForm(selectedMenu.id);
                    setEditMode(true);
                  }}
                  className="bg-amber-700 hover:bg-amber-800 rounded-full w-12 h-12 flex items-center justify-center"
                  aria-label="Edit menu"
                >
                  <Pencil className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
