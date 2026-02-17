def classify_alert(magnitude: float, seismic_zone: int | None = None) -> str:
    low = 4.0
    mid = 5.5
    if seismic_zone is not None and seismic_zone >= 5:
        low -= 0.5
        mid -= 0.5

    if magnitude < low:
        return "LOW"
    if magnitude < mid:
        return "MID"
    return "HIGH"
