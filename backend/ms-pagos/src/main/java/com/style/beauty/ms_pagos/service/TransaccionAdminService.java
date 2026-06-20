package com.style.beauty.ms_pagos.service;

import com.style.beauty.ms_pagos.dto.TransaccionPagoAdminResponse;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class TransaccionAdminService {

    private static final List<String> KNOWN_COLUMNS = List.of(
            "id_transaccion",
            "id_cita",
            "id_citas",
            "id_cliente",
            "monto",
            "buy_order",
            "session_id",
            "estado",
            "authorization_code",
            "payment_type_code",
            "response_code",
            "transaction_date",
            "created_at",
            "updated_at"
    );

    private final JdbcTemplate jdbcTemplate;

    public TransaccionAdminService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<TransaccionPagoAdminResponse> listarTransacciones() {
        Set<String> columns = columnasTransacciones();
        if (columns.isEmpty()) {
            return List.of();
        }

        String selectColumns = KNOWN_COLUMNS.stream()
                .filter(columns::contains)
                .map(column -> column + " AS " + column)
                .reduce((left, right) -> left + ", " + right)
                .orElse("id_transaccion AS id_transaccion");

        String orderBy = columns.contains("created_at") ? " ORDER BY created_at DESC" : "";

        try {
            return jdbcTemplate.query(
                    "SELECT " + selectColumns + " FROM transacciones_pago" + orderBy,
                    (rs, rowNum) -> mapRow(rs, columns)
            );
        } catch (DataAccessException ex) {
            return List.of();
        }
    }

    private Set<String> columnasTransacciones() {
        try {
            return new LinkedHashSet<>(jdbcTemplate.queryForList("""
                    SELECT column_name
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                    AND table_name = 'transacciones_pago'
                    ORDER BY ordinal_position
                    """, String.class));
        } catch (DataAccessException ex) {
            return Set.of();
        }
    }

    private TransaccionPagoAdminResponse mapRow(ResultSet rs, Set<String> columns) throws SQLException {
        return new TransaccionPagoAdminResponse(
                getUuid(rs, columns, "id_transaccion"),
                getUuid(rs, columns, "id_cita"),
                getString(rs, columns, "id_citas"),
                getUuid(rs, columns, "id_cliente"),
                getBigDecimal(rs, columns, "monto"),
                getString(rs, columns, "buy_order"),
                getString(rs, columns, "session_id"),
                getString(rs, columns, "estado"),
                getString(rs, columns, "authorization_code"),
                getString(rs, columns, "payment_type_code"),
                getInteger(rs, columns, "response_code"),
                getOffsetDateTime(rs, columns, "transaction_date"),
                getOffsetDateTime(rs, columns, "created_at"),
                getOffsetDateTime(rs, columns, "updated_at")
        );
    }

    private UUID getUuid(ResultSet rs, Set<String> columns, String column) throws SQLException {
        if (!columns.contains(column)) return null;
        Object value = rs.getObject(column);
        if (value instanceof UUID uuid) return uuid;
        return value == null ? null : UUID.fromString(String.valueOf(value));
    }

    private String getString(ResultSet rs, Set<String> columns, String column) throws SQLException {
        return columns.contains(column) ? rs.getString(column) : null;
    }

    private BigDecimal getBigDecimal(ResultSet rs, Set<String> columns, String column) throws SQLException {
        return columns.contains(column) ? rs.getBigDecimal(column) : null;
    }

    private Integer getInteger(ResultSet rs, Set<String> columns, String column) throws SQLException {
        if (!columns.contains(column)) return null;
        int value = rs.getInt(column);
        return rs.wasNull() ? null : value;
    }

    private OffsetDateTime getOffsetDateTime(ResultSet rs, Set<String> columns, String column) throws SQLException {
        if (!columns.contains(column)) return null;
        Timestamp value = rs.getTimestamp(column);
        return value == null ? null : value.toInstant().atZone(ZoneId.systemDefault()).toOffsetDateTime();
    }
}
