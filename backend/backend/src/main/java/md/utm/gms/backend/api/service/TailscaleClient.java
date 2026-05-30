package md.utm.gms.backend.api.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class TailscaleClient {

    private static final Logger log = LoggerFactory.getLogger(TailscaleClient.class);
    
    private final String apiKey;
    private final String tailnet;
    private final RestTemplate restTemplate;

    public TailscaleClient(
            @Value("${gms.tailscale.api-key:}") String apiKey,
            @Value("${gms.tailscale.tailnet:}") String tailnet) {
        this.apiKey = apiKey;
        this.tailnet = tailnet;
        this.restTemplate = new RestTemplate();
    }

    /**
     * Generates a pre-authorized, non-ephemeral Tailscale Auth Key for a gateway.
     * 
     * @param greenhouseId the identifier used for tagging the device
     * @return the generated Auth Key, or null if generation fails or is unconfigured
     */
    public String generateAuthKey(String greenhouseId) {
        if (apiKey == null || apiKey.isBlank() || tailnet == null || tailnet.isBlank()) {
            log.warn("Tailscale API key or tailnet is not configured. Skipping automated key generation.");
            return null;
        }

        try {
            String url = "https://api.tailscale.com/api/v2/tailnet/" + tailnet + "/keys";

            HttpHeaders headers = new HttpHeaders();
            headers.setBasicAuth(apiKey, ""); // Tailscale API uses HTTP Basic Auth with the token as the username
            headers.set("Content-Type", "application/json");

            // Request body for a pre-authorized, non-ephemeral, single-use key
            Map<String, Object> body = Map.of(
                    "capabilities", Map.of(
                            "devices", Map.of(
                                    "create", Map.of(
                                            "reusable", false,
                                            "ephemeral", false,
                                            "preauthorized", true,
                                            "tags", List.of("tag:gateway")
                                    )
                            )
                    )
            );

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return (String) response.getBody().get("key");
            } else {
                log.error("Failed to generate Tailscale key: {}", response.getStatusCode());
                return null;
            }
        } catch (Exception e) {
            log.error("Error communicating with Tailscale API", e);
            return null;
        }
    }
}
