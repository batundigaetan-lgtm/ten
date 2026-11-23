<?php
/**
 * Webhook / Callback Officiel MaishaPay
 * Ce fichier est appelé automatiquement par les serveurs MaishaPay dès que
 * le client valide son code PIN Mobile Money sur son téléphone.
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/maishapay.php';

header('Content-Type: application/json; charset=utf-8');

// Récupération de la référence soit en GET (?ref=...), soit dans le corps
$ref = $_GET['ref'] ?? '';

if (empty($ref)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Reference de transaction manquante.']);
    exit;
}

// Ne jamais créditer depuis le statut envoyé dans le callback :
// le statut est relu directement auprès de l'API MaishaPay.
$result = maishapay_check_status($pdo, $ref);
$processed = $result['status'] === 'approuve' || $result['status'] === 'rejete';

http_response_code(200);
echo json_encode([
    'success'   => $processed,
    'status'    => $result['status'],
    'reference' => $ref,
    'message'   => $result['message']
]);
