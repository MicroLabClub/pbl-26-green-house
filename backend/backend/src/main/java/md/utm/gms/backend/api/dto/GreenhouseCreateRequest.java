package md.utm.gms.backend.api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

public record GreenhouseCreateRequest(
        @NotBlank String name,
        @JsonProperty("greenhouse_id") String greenhouseId,
        Double latitude,
        Double longitude,
        String address,
        String description
) {
}
