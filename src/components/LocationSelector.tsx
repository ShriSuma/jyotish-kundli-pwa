import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  fetchDistricts,
  fetchStates,
  fetchVillages,
  fetchVillagesByPincode,
  getCoordinates,
  type District,
  type State,
  type Village
} from "../services/locationApi";

export type SelectedLocation = {
  stateCode: string;
  districtCode: string;
  villageName: string;
  lat: number;
  lng: number;
  pincode: string;
};

type Props = {
  onChange: (location: SelectedLocation) => void;
  /** When 6 digits, resolves state/district/post offices from India Post. */
  filterPincode?: string;
};

type PinDrive = { pin: string; districtCode: string };

export default function LocationSelector({ onChange, filterPincode }: Props): JSX.Element {
  const { t } = useTranslation();
  const [states, setStates] = useState<State[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [stateCode, setStateCode] = useState("");
  const [districtCode, setDistrictCode] = useState("");
  const [villageName, setVillageName] = useState("");
  const [loading, setLoading] = useState(false);
  const pinDriveRef = useRef<PinDrive | null>(null);
  const onChangeRef = useRef(onChange);
  const locationPushGen = useRef(0);
  onChangeRef.current = onChange;

  useEffect(() => {
    void fetchStates().then((data) => {
      setStates(data);
      if (data[0]) setStateCode((prev) => prev || data[0]!.code);
    });
  }, []);

  useEffect(() => {
    if (!filterPincode || !/^\d{6}$/.test(filterPincode)) {
      pinDriveRef.current = null;
      setVillages([]);
      setVillageName("");
      return;
    }
    locationPushGen.current += 1;
    let cancelled = false;
    setLoading(true);
    void fetchVillagesByPincode(filterPincode)
      .then((list) => {
        if (cancelled) return;
        if (!list?.length) {
          pinDriveRef.current = null;
          return;
        }
        const v0 = list[0]!;
        pinDriveRef.current = { pin: filterPincode, districtCode: v0.districtCode };
        setStateCode(v0.stateCode ?? v0.districtCode.split("-")[0] ?? "");
        setDistrictCode(v0.districtCode);
        setVillages(list);
        setVillageName(v0.name);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filterPincode]);

  useEffect(() => {
    if (!stateCode) return;
    let cancelled = false;
    setLoading(true);
    void fetchDistricts(stateCode).then((data) => {
      if (cancelled) return;
      setDistricts(data);
      setDistrictCode((prev) => {
        const pinLocked = pinDriveRef.current?.pin === filterPincode && /^\d{6}$/.test(filterPincode ?? "");
        if (pinLocked && pinDriveRef.current && data.some((d) => d.code === pinDriveRef.current!.districtCode)) {
          return pinDriveRef.current.districtCode;
        }
        if (data.some((d) => d.code === prev)) return prev;
        return data[0]?.code ?? "";
      });
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [stateCode, filterPincode]);

  useEffect(() => {
    if (!districtCode) return;
    if (pinDriveRef.current?.pin === filterPincode && /^\d{6}$/.test(filterPincode ?? "")) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    const pin = filterPincode && /^\d{6}$/.test(filterPincode) ? filterPincode : undefined;
    void fetchVillages(districtCode, pin)
      .then((data) => {
        if (cancelled) return;
        setVillages(data);
        setVillageName(data[0]?.name ?? "");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [districtCode, filterPincode]);

  const selectedVillage = useMemo(
    () => villages.find((village) => village.name === villageName),
    [villages, villageName]
  );

  const districtLabel = useMemo(
    () => districts.find((d) => d.code === districtCode)?.name ?? "",
    [districts, districtCode]
  );

  useEffect(() => {
    if (!filterPincode || !/^\d{6}$/.test(filterPincode)) return;
    if (!selectedVillage) return;
    const pushGen = locationPushGen.current;
    const pushLocation = async () => {
      if (selectedVillage.lat && selectedVillage.lng) {
        if (pushGen !== locationPushGen.current) return;
        onChangeRef.current({
          stateCode,
          districtCode,
          villageName: selectedVillage.name,
          lat: selectedVillage.lat,
          lng: selectedVillage.lng,
          pincode: selectedVillage.pincode
        });
        return;
      }
      try {
        const query = `${selectedVillage.name}, ${selectedVillage.pincode}, ${districtLabel}, India`;
        const coords = await getCoordinates(query);
        if (pushGen !== locationPushGen.current) return;
        onChangeRef.current({
          stateCode,
          districtCode,
          villageName: selectedVillage.name,
          lat: coords.lat,
          lng: coords.lng,
          pincode: selectedVillage.pincode
        });
      } catch {
        if (pushGen !== locationPushGen.current) return;
        onChangeRef.current({
          stateCode,
          districtCode,
          villageName: selectedVillage.name,
          lat: selectedVillage.lat,
          lng: selectedVillage.lng,
          pincode: selectedVillage.pincode
        });
      }
    };
    void pushLocation();
  }, [districtCode, districtLabel, selectedVillage, stateCode, filterPincode]);

  return (
    <div className="grid gap-2 md:grid-cols-3">
      <select
        aria-label="State"
        className="min-h-11 rounded-xl border border-fuchsia-300 bg-white/90 px-3 py-2 text-sm"
        value={stateCode}
        onChange={(event) => {
          pinDriveRef.current = null;
          setStateCode(event.target.value);
        }}
      >
        {states.map((state) => (
          <option key={state.code} value={state.code}>
            {state.name}
          </option>
        ))}
      </select>

      <select
        aria-label="District"
        className="min-h-11 rounded-xl border border-cyan-300 bg-white/90 px-3 py-2 text-sm"
        value={districtCode}
        onChange={(event) => {
          pinDriveRef.current = null;
          setDistrictCode(event.target.value);
        }}
      >
        {districts.map((district) => (
          <option key={district.code} value={district.code}>
            {district.name}
          </option>
        ))}
      </select>

      <select
        aria-label="Village"
        className="min-h-11 rounded-xl border border-amber-300 bg-white/90 px-3 py-2 text-sm"
        value={villageName}
        onChange={(event) => setVillageName(event.target.value)}
      >
        {villages.map((village) => (
          <option key={`${village.districtCode}-${village.name}-${village.pincode}`} value={village.name}>
            {village.name} ({village.pincode})
          </option>
        ))}
      </select>

      {loading && <p className="col-span-full text-xs text-slate-600">{t("location.loading")}</p>}
    </div>
  );
}
