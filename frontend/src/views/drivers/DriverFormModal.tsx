import React, { useState, useEffect } from "react";
import {
  Driver,
  CreateDriverForm,
  ContractType,
} from "../../models/driver.model";
import { Company, Camp, Route } from "../../models/master.model";
import { ApiService } from "../../services/apiService";
import {
  formatPhoneNumber,
  normalizePhoneNumber,
} from "../../utils/phoneFormat";
import {
  X,
  User,
  Phone,
  Briefcase,
  Hash,
  Building2,
  MapPin,
  Plus,
  Trash2,
  Loader2,
  CalendarDays,
  Layers,
} from "lucide-react";

interface CampRouteSelection {
  campId?: number;
  campName: string;
  routeId?: number;
  routeName: string;
  availableRoutes: Route[];
}

interface FixedHolidaySelection {
  weekCycle: string; // '매주' | '1,3주' | '2,4주' | '1주' | '2주' | '3주' | '4주' | '5주'
  dayOfWeek: string; // '월' | '화' | '수' | '목' | '금' | '토' | '일'
}

interface RoutePatternSelection {
  weekCycle: string; // '1,3주', '2,4주', '매주', '1주'~'5주'
  dayOfWeek: string; // '화,수', '목,금', '토' 등
  campName: string;
  routeName: string;
  availableRoutes?: Route[];
}

const WEEK_DAYS = ["일", "월", "화", "수", "목", "금", "토"];
const WEEK_CYCLE_OPTIONS = [
  "매주",
  "1,3주",
  "2,4주",
  "1주",
  "2주",
  "3주",
  "4주",
  "5주",
];

export function sortFixedHolidays<
  T extends { weekCycle: string; dayOfWeek: string },
>(holidays: T[]): T[] {
  return [...holidays].sort((a, b) => {
    const cycleA = WEEK_CYCLE_OPTIONS.indexOf(a.weekCycle);
    const cycleB = WEEK_CYCLE_OPTIONS.indexOf(b.weekCycle);
    const idxA = cycleA === -1 ? 999 : cycleA;
    const idxB = cycleB === -1 ? 999 : cycleB;

    if (idxA !== idxB) {
      return idxA - idxB;
    }

    const firstDayA = (a.dayOfWeek || "").split(",")[0]?.trim() || "";
    const firstDayB = (b.dayOfWeek || "").split(",")[0]?.trim() || "";
    const dayIdxA = WEEK_DAYS.indexOf(firstDayA);
    const dayIdxB = WEEK_DAYS.indexOf(firstDayB);
    const validDayA = dayIdxA === -1 ? 999 : dayIdxA;
    const validDayB = dayIdxB === -1 ? 999 : dayIdxB;

    return validDayA - validDayB;
  });
}

interface Props {
  isOpen: boolean;
  driver: Driver | null;
  onClose: () => void;
  onSubmit: (form: CreateDriverForm) => Promise<void> | void;
}

export const DriverFormModal: React.FC<Props> = ({
  isOpen,
  driver,
  onClose,
  onSubmit,
}) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<
    number | undefined
  >(undefined);

  const [availableCamps, setAvailableCamps] = useState<Camp[]>([]);
  const [routesCache, setRoutesCache] = useState<Route[]>([]);

  const [driverCode, setDriverCode] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [campRoutes, setCampRoutes] = useState<CampRouteSelection[]>([
    { campName: "", routeName: "", availableRoutes: [] },
  ]);
  const [contractType, setContractType] = useState<ContractType>("고정");
  const [fixedHolidays, setFixedHolidays] = useState<FixedHolidaySelection[]>(
    [],
  );
  const [routePatterns, setRoutePatterns] = useState<RoutePatternSelection[]>(
    [],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Companies & Camps when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsSubmitting(false);
      loadInitialData();
    }
  }, [isOpen, driver]);

  const loadInitialData = async () => {
    try {
      const [compList, campList, allRoutesList] = await Promise.all([
        ApiService.getCompanies().catch(() => []),
        ApiService.getCamps().catch(() => []),
        ApiService.getRoutes().catch(() => []),
      ]);

      setCompanies(compList);
      const sortedCamps = [...campList].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true }),
      );
      setAvailableCamps(sortedCamps);
      setRoutesCache(allRoutesList);

      let compId = driver?.companyId;
      if (!compId && compList.length > 0) {
        compId = compList[0].id;
      }
      setSelectedCompanyId(compId);

      const getRoutesByCampId = (campId?: number) => {
        if (!campId) return [];
        return allRoutesList
          .filter((r) => r.campId === campId)
          .sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { numeric: true }),
          );
      };

      // 기사 정보가 있는 경우 폼 초기화
      if (driver) {
        setName(driver.name);
        setPhone(formatPhoneNumber(driver.phone));
        setDriverCode(driver.driverCode || "");
        setContractType(driver.contractType);

        if (driver.fixedHolidays && driver.fixedHolidays.length > 0) {
          setFixedHolidays(
            driver.fixedHolidays.map((h) => ({
              weekCycle: h.weekCycle,
              dayOfWeek: h.dayOfWeek,
            })),
          );
        } else {
          setFixedHolidays([]);
        }

        // 정기 노선 패턴 초기화 (메모리 캐시에서 즉시 매핑)
        if (driver.routePatterns && driver.routePatterns.length > 0) {
          const initialPatterns = driver.routePatterns.map((p) => {
            const matchedCamp = sortedCamps.find(
              (c) => c.name.toLowerCase() === p.campName.toLowerCase(),
            );
            const rList = matchedCamp ? getRoutesByCampId(matchedCamp.id) : [];
            return {
              weekCycle: p.weekCycle,
              dayOfWeek: p.dayOfWeek,
              campName: p.campName,
              routeName: p.routeName,
              availableRoutes: rList,
            };
          });
          setRoutePatterns(initialPatterns);
        } else {
          setRoutePatterns([]);
        }

        const camps = (driver.camp || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        const routes = (driver.routes || "").split(",").map((s) => s.trim());

        if (camps.length > 0) {
          // 각 캠프에 대한 라우터 목록 즉시 생성
          const initialSelections: CampRouteSelection[] = camps.map(
            (cName, i) => {
              const rName = routes[i] || "";
              const matchedCamp = sortedCamps.find(
                (c) => c.name.toLowerCase() === cName.toLowerCase(),
              );
              const rList = matchedCamp
                ? getRoutesByCampId(matchedCamp.id)
                : [];
              return {
                campId: matchedCamp?.id,
                campName: cName,
                routeName: rName,
                availableRoutes: rList,
              };
            },
          );
          setCampRoutes(initialSelections);
        } else {
          setCampRoutes([{ campName: "", routeName: "", availableRoutes: [] }]);
        }
      } else {
        setName("");
        setPhone("");
        setDriverCode("");
        setContractType("고정");
        setFixedHolidays([]);
        setRoutePatterns([]);
        setCampRoutes([{ campName: "", routeName: "", availableRoutes: [] }]);
      }
    } catch (err) {
      console.error("[loadInitialData error]:", err);
    }
  };

  // Handle Camp selection change in a row
  const handleCampSelect = async (index: number, campName: string) => {
    if (!campName) {
      setCampRoutes((prev) =>
        prev.map((cr, i) =>
          i === index
            ? {
                ...cr,
                campId: undefined,
                campName: "",
                routeId: undefined,
                routeName: "",
                availableRoutes: [],
              }
            : cr,
        ),
      );
      return;
    }

    const matchedCamp = availableCamps.find(
      (c) => c.name.toLowerCase() === campName.toLowerCase(),
    );
    let rList = matchedCamp
      ? routesCache.filter((r) => r.campId === matchedCamp.id)
      : [];

    if (matchedCamp && rList.length === 0) {
      try {
        rList = await ApiService.getRoutes(matchedCamp.id);
      } catch (err) {
        console.error(err);
      }
    }

    const sortedRoutes = [...rList].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true }),
    );

    setCampRoutes((prev) =>
      prev.map((cr, i) =>
        i === index
          ? {
              ...cr,
              campId: matchedCamp?.id,
              campName,
              routeId: undefined,
              routeName: "", // 캠프가 변경되면 라우터 초기화
              availableRoutes: sortedRoutes,
            }
          : cr,
      ),
    );
  };

  // Handle Route selection change in a row
  const handleRouteSelect = (index: number, routeName: string) => {
    setCampRoutes((prev) =>
      prev.map((cr, i) =>
        i === index
          ? {
              ...cr,
              routeName,
            }
          : cr,
      ),
    );
  };

  const handleAddRow = () => {
    setCampRoutes((prev) => [
      ...prev,
      { campName: "", routeName: "", availableRoutes: [] },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (campRoutes.length === 1) {
      setCampRoutes([{ campName: "", routeName: "", availableRoutes: [] }]);
    } else {
      setCampRoutes((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // 고정 휴무 핸들러 (기본 선택 없이 빈값으로 추가)
  const handleAddFixedHoliday = () => {
    setFixedHolidays((prev) => [...prev, { weekCycle: "매주", dayOfWeek: "" }]);
  };

  const handleUpdateFixedHolidayCycle = (index: number, weekCycle: string) => {
    setFixedHolidays((prev) =>
      prev.map((fh, i) => (i === index ? { ...fh, weekCycle } : fh)),
    );
  };

  // 요일 복수 선택 토글 핸들러 (쉼표 구분 저장, 요일 순서 정렬)
  const handleToggleFixedHolidayDay = (index: number, day: string) => {
    setFixedHolidays((prev) =>
      prev.map((fh, i) => {
        if (i !== index) return fh;
        const currentDays = (fh.dayOfWeek || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

        let nextDays: string[];
        if (currentDays.includes(day)) {
          nextDays = currentDays.filter((d) => d !== day);
        } else {
          nextDays = [...currentDays, day];
        }

        nextDays.sort((a, b) => WEEK_DAYS.indexOf(a) - WEEK_DAYS.indexOf(b));

        return {
          ...fh,
          dayOfWeek: nextDays.join(","),
        };
      }),
    );
  };

  const handleRemoveFixedHoliday = (index: number) => {
    setFixedHolidays((prev) => prev.filter((_, i) => i !== index));
  };

  // 정기 노선 패턴 핸들러 (신규 등록 시 상단에 추가 및 기본 선택값 없음)
  const handleAddRoutePattern = () => {
    setRoutePatterns((prev) => [
      {
        weekCycle: "",
        dayOfWeek: "",
        campName: "",
        routeName: "",
        availableRoutes: [],
      },
      ...prev,
    ]);
  };

  const handleUpdateRoutePatternCycle = (index: number, weekCycle: string) => {
    setRoutePatterns((prev) =>
      prev.map((p, i) => (i === index ? { ...p, weekCycle } : p)),
    );
  };

  const handleToggleRoutePatternDay = (index: number, day: string) => {
    setRoutePatterns((prev) =>
      prev.map((p, i) => {
        if (i !== index) return p;
        const currentDays = (p.dayOfWeek || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

        let nextDays: string[];
        if (currentDays.includes(day)) {
          nextDays = currentDays.filter((d) => d !== day);
        } else {
          nextDays = [...currentDays, day];
        }

        nextDays.sort((a, b) => WEEK_DAYS.indexOf(a) - WEEK_DAYS.indexOf(b));

        return {
          ...p,
          dayOfWeek: nextDays.join(","),
        };
      }),
    );
  };

  const handleUpdateRoutePatternCamp = async (
    index: number,
    campName: string,
  ) => {
    const matchedCamp = availableCamps.find(
      (c) => c.name.toLowerCase() === campName.toLowerCase(),
    );
    let rList = matchedCamp
      ? routesCache.filter((r) => r.campId === matchedCamp.id)
      : [];

    if (matchedCamp && rList.length === 0) {
      try {
        rList = await ApiService.getRoutes(matchedCamp.id);
      } catch {
        rList = [];
      }
    }
    const sorted = [...rList].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true }),
    );
    setRoutePatterns((prev) =>
      prev.map((p, i) =>
        i === index
          ? {
              ...p,
              campName,
              routeName: sorted[0]?.name || "",
              availableRoutes: sorted,
            }
          : p,
      ),
    );
  };

  const handleUpdateRoutePatternRoute = (index: number, routeName: string) => {
    setRoutePatterns((prev) =>
      prev.map((p, i) => (i === index ? { ...p, routeName } : p)),
    );
  };

  const handleRemoveRoutePattern = (index: number) => {
    setRoutePatterns((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!name.trim() || !phone.trim()) {
      alert("기사명과 연락처는 필수 입력 항목입니다.");
      return;
    }

    const validPairs = campRoutes.filter((cr) => cr.campName.trim());
    if (validPairs.length === 0) {
      alert("담당 캠프를 하나 이상 선택해주세요.");
      return;
    }
    const missingRoute = validPairs.find((cr) => !cr.routeName.trim());
    if (missingRoute) {
      alert(`'${missingRoute.campName}' 캠프의 라우트를 선택해주세요.`);
      return;
    }

    const validRoutePatterns = routePatterns
      .filter((p) => p.weekCycle && p.dayOfWeek && (p.campName || p.routeName))
      .map((p) => {
        const matchedCamp = availableCamps.find(
          (c) => c.name.toLowerCase().trim() === p.campName.toLowerCase().trim(),
        );
        const campId = matchedCamp?.id;
        const matchedRoute = matchedCamp
          ? routesCache.find(
              (r) =>
                r.campId === campId &&
                r.name.toLowerCase().trim() === p.routeName.toLowerCase().trim(),
            )
          : undefined;
        const routeId = matchedRoute?.id;

        return {
          weekCycle: p.weekCycle.trim(),
          dayOfWeek: p.dayOfWeek.trim(),
          campId,
          campName: p.campName.trim(),
          routeId,
          routeName: p.routeName.trim(),
        };
      });

    // 기사 수정 시 변경된 내용이 없는지 검사
    if (driver) {
      const origCompanyId = driver.companyId;
      const origDriverCode = (driver.driverCode || "").trim();
      const origName = (driver.name || "").trim();
      const origPhone = normalizePhoneNumber(driver.phone || "");
      const origContractType = driver.contractType;
      const origCamp = (driver.camp || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .join(",");
      const origRoutes = (driver.routes || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .join(",");

      const currentCamp = validPairs.map((p) => p.campName.trim()).join(",");
      const currentRoutes = validPairs.map((p) => p.routeName.trim()).join(",");

      const origHolidaysStr = JSON.stringify(
        sortFixedHolidays(
          (driver.fixedHolidays || []).map((h) => ({
            weekCycle: h.weekCycle.trim(),
            dayOfWeek: h.dayOfWeek.trim(),
          })),
        ),
      );
      const currentHolidaysStr = JSON.stringify(
        sortFixedHolidays(
          fixedHolidays
            .filter((h) => h.weekCycle && h.dayOfWeek)
            .map((h) => ({
              weekCycle: h.weekCycle.trim(),
              dayOfWeek: h.dayOfWeek.trim(),
            })),
        ),
      );

      const origPatternsStr = JSON.stringify(
        (driver.routePatterns || []).map((p) => ({
          weekCycle: p.weekCycle.trim(),
          dayOfWeek: p.dayOfWeek.trim(),
          campName: (p.campName || "").trim(),
          routeName: (p.routeName || "").trim(),
        })),
      );
      const currentPatternsStr = JSON.stringify(
        validRoutePatterns.map((p) => ({
          weekCycle: p.weekCycle,
          dayOfWeek: p.dayOfWeek,
          campName: p.campName,
          routeName: p.routeName,
        })),
      );

      const isUnchanged =
        (selectedCompanyId ?? undefined) === (origCompanyId ?? undefined) &&
        driverCode.trim() === origDriverCode &&
        name.trim() === origName &&
        normalizePhoneNumber(phone) === origPhone &&
        contractType === origContractType &&
        currentCamp === origCamp &&
        currentRoutes === origRoutes &&
        origHolidaysStr === currentHolidaysStr &&
        origPatternsStr === currentPatternsStr;

      if (isUnchanged) {
        alert("수정할 변경 내용이 없습니다.");
        return;
      }
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        companyId: selectedCompanyId,
        driverCode: driverCode.trim(),
        name: name.trim(),
        phone: normalizePhoneNumber(phone),
        camp: validPairs.map((p) => p.campName).join(","),
        routes: validPairs.map((p) => p.routeName).join(","),
        contractType,
        fixedHolidays: sortFixedHolidays(
          fixedHolidays.filter((h) => h.weekCycle && h.dayOfWeek),
        ),
        routePatterns: validRoutePatterns,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const completedPairs = campRoutes.filter(
    (cr) => cr.campName.trim() && cr.routeName.trim(),
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-none">
                {driver ? "기사 정보 수정" : "신규 기사 등록"}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                기본 인적사항, 배정 캠프/라우트 및 고정 휴무를 지정하세요.
              </p>
            </div>
          </div>
          <button
            disabled={isSubmitting}
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4 overflow-y-auto flex-1"
        >
          {/* 소속 회사 선택 */}
          {companies.length > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                소속 회사 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3 z-10" />
                <select
                  disabled={isSubmitting}
                  value={selectedCompanyId || ""}
                  onChange={(e) => setSelectedCompanyId(Number(e.target.value))}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition appearance-none cursor-pointer disabled:opacity-50"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* 기사명 */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              기사명 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                disabled={isSubmitting}
                type="text"
                required
                placeholder="예: 김쿠팡"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition disabled:opacity-50"
              />
            </div>
          </div>

          {/* 연락처 */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              연락처 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                disabled={isSubmitting}
                type="text"
                required
                placeholder="010-1234-5678"
                value={phone}
                onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition font-mono disabled:opacity-50"
              />
            </div>
          </div>

          {/* 담당 캠프 및 라우트 (1:1 Multi-Row Selection) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                담당 캠프 및 라우터 지정 <span className="text-red-500">*</span>
              </label>
              <button
                disabled={isSubmitting}
                type="button"
                onClick={handleAddRow}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/70 px-2 py-1 rounded-lg transition disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>캠프/라우트 추가</span>
              </button>
            </div>

            {/* 컬럼 헤더 */}
            <div className="grid grid-cols-[1fr_1fr_32px] gap-2 mb-1.5 px-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Building2 className="w-3 h-3" /> 캠프 선택
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> 라우터 선택{" "}
                <span className="text-red-400">(필수)</span>
              </span>
              <span />
            </div>

            {/* 선택 행들 */}
            <div className="space-y-2">
              {campRoutes.map((cr, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[1fr_1fr_32px] gap-2 items-center"
                >
                  {/* 캠프 드롭다운 */}
                  <select
                    disabled={isSubmitting}
                    value={cr.campName || ""}
                    onChange={(e) => handleCampSelect(index, e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none transition cursor-pointer min-w-0 disabled:opacity-50"
                  >
                    <option value="">캠프 선택</option>
                    {cr.campName &&
                      !availableCamps.some((c) => c.name === cr.campName) && (
                        <option value={cr.campName}>{cr.campName}</option>
                      )}
                    {availableCamps.map((c) => (
                      <option key={c.id || c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  {/* 라우터 드롭다운 */}
                  <select
                    disabled={!cr.campName || isSubmitting}
                    value={cr.routeName || ""}
                    onChange={(e) => handleRouteSelect(index, e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl text-xs font-semibold focus:ring-2 outline-none transition min-w-0 ${
                      !cr.campName
                        ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                        : cr.campName && !cr.routeName
                          ? "bg-red-50 border-red-300 focus:ring-red-400 cursor-pointer"
                          : "bg-slate-50 border-slate-200 focus:ring-blue-500 focus:bg-white cursor-pointer"
                    }`}
                  >
                    <option value="">
                      {!cr.campName ? "캠프선택필요" : "라우터 선택"}
                    </option>
                    {cr.routeName &&
                      !cr.availableRoutes.some(
                        (r) => r.name === cr.routeName,
                      ) && <option value={cr.routeName}>{cr.routeName}</option>}
                    {cr.availableRoutes.map((r) => (
                      <option key={r.id || r.name} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </select>

                  <button
                    disabled={isSubmitting}
                    type="button"
                    onClick={() => handleRemoveRow(index)}
                    className="flex items-center justify-center w-8 h-8 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* 인라인 미리보기 */}
            {completedPairs.length > 0 && (
              <div className="mt-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  선택된 캠프/라우터
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {completedPairs.map((cr, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 text-white font-bold rounded-lg text-[11px] shadow-xs"
                    >
                      <Building2 className="w-3 h-3 opacity-70" />
                      {cr.campName}
                      <span className="opacity-40 mx-0.5">·</span>
                      <MapPin className="w-3 h-3 opacity-70" />
                      {cr.routeName}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. 주차·요일별 정기 노선 편성표 (1,3주 / 2,4주 다중 캠프 및 라우터) */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>주차·요일별 정기 노선 편성표</span>
                  <span className="text-slate-400 font-normal">
                    (1,3주 / 2,4주 다중 배송)
                  </span>
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  1,3주 및 2,4주별로 담당하는 캠프와 라우터를 요일별로
                  지정합니다.
                </p>
              </div>
            </div>

            {/* 📊 주간 정기 노선 타임테이블 엑셀 뷰 */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs bg-white">
              <table className="w-full text-center border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold divide-x divide-slate-800 text-[11px]">
                    <th className="py-2 px-2 bg-slate-900 w-16 text-slate-300">
                      구분
                    </th>
                    {WEEK_DAYS.map((day) => {
                      const isSun = day === "일";
                      const isSat = day === "토";
                      return (
                        <th
                          key={day}
                          className={`py-2 px-1.5 min-w-[58px] ${
                            isSun
                              ? "text-red-400"
                              : isSat
                                ? "text-blue-400"
                                : "text-slate-200"
                          }`}
                        >
                          {day}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {/* Row: 1/3주 */}
                  <tr className="hover:bg-slate-50/60 transition divide-x divide-slate-100">
                    <td className="py-2 px-2 bg-slate-100 font-bold text-slate-700 text-[11px] whitespace-nowrap">
                      1/3주
                    </td>
                    {WEEK_DAYS.map((day) => {
                      // 고정 휴무 검사
                      const isHoliday = fixedHolidays.some(
                        (h) =>
                          (h.weekCycle === "매주" ||
                            h.weekCycle === "1,3주" ||
                            h.weekCycle === "1주" ||
                            h.weekCycle === "3주" ||
                            h.weekCycle === "5주") &&
                          (h.dayOfWeek || "")
                            .split(",")
                            .map((s) => s.trim())
                            .includes(day),
                      );

                      // 정기 노선 검사
                      const matchedPattern = routePatterns.find(
                        (p) =>
                          (p.weekCycle === "매주" ||
                            p.weekCycle === "1,3주" ||
                            p.weekCycle === "1주" ||
                            p.weekCycle === "3주" ||
                            p.weekCycle === "5주") &&
                          (p.dayOfWeek || "")
                            .split(",")
                            .map((s) => s.trim())
                            .includes(day),
                      );

                      if (isHoliday) {
                        return (
                          <td
                            key={day}
                            className="py-1.5 px-1 bg-red-50/60 text-red-700 font-extrabold text-[11px]"
                          >
                            X
                          </td>
                        );
                      }

                      if (
                        matchedPattern &&
                        (matchedPattern.campName || matchedPattern.routeName)
                      ) {
                        const shortCamp = (matchedPattern.campName || "")
                          .replace("남양주", "남")
                          .replace("구리", "구");
                        const display = matchedPattern.routeName
                          ? `${shortCamp}/${matchedPattern.routeName}`
                          : shortCamp;
                        return (
                          <td
                            key={day}
                            className="py-1.5 px-0.5 bg-blue-50/70 text-blue-900 font-bold text-[10px] truncate max-w-[65px]"
                            title={`${matchedPattern.campName} / ${matchedPattern.routeName}`}
                          >
                            {display}
                          </td>
                        );
                      }

                      return (
                        <td
                          key={day}
                          className="py-1.5 px-1 text-slate-300 text-[10px]"
                        >
                          -
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row: 2/4주 */}
                  <tr className="hover:bg-slate-50/60 transition divide-x divide-slate-100">
                    <td className="py-2 px-2 bg-slate-100 font-bold text-slate-700 text-[11px] whitespace-nowrap">
                      2/4주
                    </td>
                    {WEEK_DAYS.map((day) => {
                      // 고정 휴무 검사
                      const isHoliday = fixedHolidays.some(
                        (h) =>
                          (h.weekCycle === "매주" ||
                            h.weekCycle === "2,4주" ||
                            h.weekCycle === "2주" ||
                            h.weekCycle === "4주") &&
                          (h.dayOfWeek || "")
                            .split(",")
                            .map((s) => s.trim())
                            .includes(day),
                      );

                      // 정기 노선 검사
                      const matchedPattern = routePatterns.find(
                        (p) =>
                          (p.weekCycle === "매주" ||
                            p.weekCycle === "2,4주" ||
                            p.weekCycle === "2주" ||
                            p.weekCycle === "4주") &&
                          (p.dayOfWeek || "")
                            .split(",")
                            .map((s) => s.trim())
                            .includes(day),
                      );

                      if (isHoliday) {
                        return (
                          <td
                            key={day}
                            className="py-1.5 px-1 bg-red-50/60 text-red-700 font-extrabold text-[11px]"
                          >
                            X
                          </td>
                        );
                      }

                      if (
                        matchedPattern &&
                        (matchedPattern.campName || matchedPattern.routeName)
                      ) {
                        const shortCamp = (matchedPattern.campName || "")
                          .replace("남양주", "남")
                          .replace("구리", "구");
                        const display = matchedPattern.routeName
                          ? `${shortCamp}/${matchedPattern.routeName}`
                          : shortCamp;
                        return (
                          <td
                            key={day}
                            className="py-1.5 px-0.5 bg-blue-50/70 text-blue-900 font-bold text-[10px] truncate max-w-[65px]"
                            title={`${matchedPattern.campName} / ${matchedPattern.routeName}`}
                          >
                            {display}
                          </td>
                        );
                      }

                      return (
                        <td
                          key={day}
                          className="py-1.5 px-1 text-slate-300 text-[10px]"
                        >
                          -
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 정기 노선 패턴 목록 편집 */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="block text-[11px] font-bold text-slate-700">
                  등록된 정기 노선 패턴 ({routePatterns.length}개)
                </span>
                <button
                  disabled={isSubmitting}
                  type="button"
                  onClick={handleAddRoutePattern}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md transition disabled:opacity-50"
                >
                  <Plus className="w-3 h-3" />
                  <span>새 패턴 추가 (상단 추가)</span>
                </button>
              </div>

              {routePatterns.length === 0 ? (
                <div className="p-4 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                  등록된 정기 노선 패턴이 없습니다. 1,3주 또는 2,4주 패턴이
                  필요한 경우 '+ 정기 노선 추가'를 눌러주세요.
                </div>
              ) : (
                routePatterns.map((pattern, pIdx) => {
                  const routesForCamp = pattern.availableRoutes || [];

                  return (
                    <div
                      key={pIdx}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        {/* 주차 선택 */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-600 shrink-0">
                            주차:
                          </span>
                          <select
                            disabled={isSubmitting}
                            value={pattern.weekCycle}
                            onChange={(e) =>
                              handleUpdateRoutePatternCycle(
                                pIdx,
                                e.target.value,
                              )
                            }
                            className={`px-2 py-1.5 bg-white border rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer ${
                              !pattern.weekCycle
                                ? "text-slate-400 border-amber-300"
                                : "text-slate-800 border-slate-200"
                            }`}
                          >
                            <option value="" disabled>
                              주차 선택
                            </option>
                            {WEEK_CYCLE_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* 캠프 & 라우터 선택 */}
                        <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                          <select
                            disabled={isSubmitting}
                            value={pattern.campName}
                            onChange={(e) =>
                              handleUpdateRoutePatternCamp(pIdx, e.target.value)
                            }
                            className={`flex-1 px-2 py-1.5 bg-white border rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer ${
                              !pattern.campName
                                ? "text-slate-400 border-amber-300"
                                : "text-slate-800 border-slate-200"
                            }`}
                          >
                            <option value="" disabled>
                              캠프 선택
                            </option>
                            {availableCamps.map((c) => (
                              <option key={c.id} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                          </select>

                          <select
                            disabled={isSubmitting || !pattern.campName}
                            value={pattern.routeName}
                            onChange={(e) =>
                              handleUpdateRoutePatternRoute(
                                pIdx,
                                e.target.value,
                              )
                            }
                            className={`flex-1 px-2 py-1.5 bg-white border rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer disabled:opacity-50 ${
                              !pattern.routeName
                                ? "text-slate-400 border-amber-300"
                                : "text-slate-800 border-slate-200"
                            }`}
                          >
                            <option value="" disabled>
                              라우트 선택
                            </option>
                            {routesForCamp.map((r) => (
                              <option key={r.id} value={r.name}>
                                {r.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          disabled={isSubmitting}
                          type="button"
                          onClick={() => handleRemoveRoutePattern(pIdx)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                          title="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* 요일 버튼 그룹 */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="block text-[11px] font-bold text-slate-500">
                            근무 요일{" "}
                            <span className="text-[10px] text-blue-600 font-normal">
                              (복수 선택)
                            </span>
                            :
                          </span>
                          {pattern.dayOfWeek ? (
                            <span className="text-[11px] font-extrabold text-blue-600">
                              선택됨: {pattern.dayOfWeek.split(",").join(", ")}
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                              요일을 선택해주세요
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {WEEK_DAYS.map((day) => {
                            const selectedDays = (pattern.dayOfWeek || "")
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean);
                            const isSelected = selectedDays.includes(day);
                            const isSun = day === "일";
                            const isSat = day === "토";
                            return (
                              <button
                                key={day}
                                type="button"
                                disabled={isSubmitting}
                                onClick={() =>
                                  handleToggleRoutePatternDay(pIdx, day)
                                }
                                className={`py-1 text-xs font-bold rounded-lg transition text-center ${
                                  isSelected
                                    ? "bg-blue-600 text-white shadow-xs ring-2 ring-blue-400/50"
                                    : isSun
                                      ? "bg-white border border-red-200 text-red-600 hover:bg-red-50"
                                      : isSat
                                        ? "bg-white border border-blue-200 text-blue-600 hover:bg-blue-50"
                                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                                }`}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 고정 휴무일 설정 (다중 패턴 지원: 주단위 + 요일) */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  고정 휴무일 설정{" "}
                  <span className="text-slate-400 font-normal">(선택사항)</span>
                </label>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  정기 휴무가 있는 경우 주차 및 요일을 지정합니다. (복수 등록
                  가능)
                </p>
              </div>
              <button
                disabled={isSubmitting}
                type="button"
                onClick={handleAddFixedHoliday}
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/70 px-2.5 py-1 rounded-lg transition disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>휴무 추가</span>
              </button>
            </div>

            {fixedHolidays.length === 0 ? (
              <div className="p-3 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                설정된 고정 휴무가 없습니다. 고정 휴무가 있는 기사는 '+ 휴무
                추가'를 눌러주세요.
              </div>
            ) : (
              <div className="space-y-2.5">
                {fixedHolidays.map((fh, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-xs font-bold text-slate-600 shrink-0">
                          주차 선택:
                        </span>
                        <select
                          disabled={isSubmitting}
                          value={fh.weekCycle}
                          onChange={(e) =>
                            handleUpdateFixedHolidayCycle(idx, e.target.value)
                          }
                          className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                        >
                          {WEEK_CYCLE_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        disabled={isSubmitting}
                        type="button"
                        onClick={() => handleRemoveFixedHoliday(idx)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                        title="삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* 요일 버튼 그룹 (복수 선택 지원) */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="block text-[11px] font-bold text-slate-500">
                          요일 선택{" "}
                          <span className="text-[10px] text-indigo-500 font-normal">
                            (복수 선택 가능)
                          </span>
                          :
                        </span>
                        {fh.dayOfWeek ? (
                          <span className="text-[11px] font-extrabold text-indigo-600">
                            선택됨: {fh.dayOfWeek.split(",").join(", ")}
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                            요일을 선택해주세요
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {WEEK_DAYS.map((day) => {
                          const selectedDays = (fh.dayOfWeek || "")
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean);
                          const isSelected = selectedDays.includes(day);
                          const isSun = day === "일";
                          const isSat = day === "토";
                          return (
                            <button
                              key={day}
                              type="button"
                              disabled={isSubmitting}
                              onClick={() =>
                                handleToggleFixedHolidayDay(idx, day)
                              }
                              className={`py-1.5 text-xs font-bold rounded-lg transition text-center ${
                                isSelected
                                  ? "bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-400/50"
                                  : isSun
                                    ? "bg-white border border-red-200 text-red-600 hover:bg-red-50"
                                    : isSat
                                      ? "bg-white border border-blue-200 text-blue-600 hover:bg-blue-50"
                                      : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                              }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}

                {/* 설정된 고정 휴무 요약 배지 */}
                <div className="p-2.5 bg-indigo-50/60 rounded-xl border border-indigo-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 mb-1.5">
                    설정된 고정 휴무 미리보기
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {sortFixedHolidays(
                      fixedHolidays.filter((fh) => fh.dayOfWeek),
                    ).map((fh, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600 text-white font-bold rounded-lg text-[11px] shadow-xs"
                      >
                        <CalendarDays className="w-3 h-3 opacity-80" />
                        {fh.weekCycle} {fh.dayOfWeek.split(",").join(", ")}요일
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 계약 형태 */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              계약 형태 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3 z-10" />
              <select
                disabled={isSubmitting}
                value={contractType}
                onChange={(e) =>
                  setContractType(e.target.value as ContractType)
                }
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition appearance-none cursor-pointer disabled:opacity-50"
              >
                <option value="고정">고정</option>
                <option value="용차">용차</option>
                <option value="백업">백업</option>
              </select>
            </div>
          </div>

          {/* 사용 ID */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              사용 ID <span className="text-slate-400 font-normal">(선택)</span>
            </label>
            <div className="relative">
              <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                disabled={isSubmitting}
                type="text"
                placeholder="실제 업무 기사 ID (선택사항)"
                value={driverCode}
                onChange={(e) => setDriverCode(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition disabled:opacity-50"
              />
            </div>
            {driver && (
              <p className="text-[11px] text-slate-400 mt-1">
                시스템 키 번호: #{driver.id}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              disabled={isSubmitting}
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
            >
              취소
            </button>
            <button
              disabled={isSubmitting}
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20 transition disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>{driver ? "수정 중..." : "기사 등록 중..."}</span>
                </>
              ) : (
                <span>{driver ? "수정 완료" : "신규 기사 등록"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
