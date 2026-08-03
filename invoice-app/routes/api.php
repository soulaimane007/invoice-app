<?php

use App\Http\Controllers\Api\ArticleController;
use App\Http\Controllers\Api\ArticleMatriculeController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\CompanySettingController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DevisController;
use App\Http\Controllers\Api\FactureController;
use App\Http\Controllers\Api\OrganizationController;
use App\Http\Controllers\Api\SousClientController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

Route::middleware(['auth:sanctum', 'active'])->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::put('/auth/password', [AuthController::class, 'updatePassword']);

    Route::middleware('role:organization,developer')->get('/audit-logs', [AuditLogController::class, 'index']);

    Route::middleware('role:developer')->group(function () {
        Route::get('/organizations', [OrganizationController::class, 'index']);
        Route::post('/organizations', [OrganizationController::class, 'store']);
        Route::put('/organizations/{organization}/password', [OrganizationController::class, 'resetPassword']);
        Route::put('/organizations/{organization}/active', [OrganizationController::class, 'toggleActive']);
    });

    Route::middleware('role:organization')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::put('/users/{user}', [UserController::class, 'update']);
        Route::put('/users/{user}/password', [UserController::class, 'resetPassword']);
        Route::put('/users/{user}/active', [UserController::class, 'toggleActive']);

Route::post('/document-templates', [\App\Http\Controllers\Api\DocumentTemplateController::class, 'store']);
    Route::post('/document-templates/import', [\App\Http\Controllers\Api\DocumentTemplateController::class, 'import']);
    Route::put('/document-templates/{document_template}', [\App\Http\Controllers\Api\DocumentTemplateController::class, 'update']);
    Route::delete('/document-templates/{document_template}', [\App\Http\Controllers\Api\DocumentTemplateController::class, 'destroy']);
    });

    Route::middleware('role:organization,user')->group(function () {
     Route::get('/document-templates', [\App\Http\Controllers\Api\DocumentTemplateController::class, 'index']);
    Route::post('/document-templates/preview', [\App\Http\Controllers\Api\DocumentTemplateController::class, 'preview']);
    Route::get('/document-templates/{document_template}', [\App\Http\Controllers\Api\DocumentTemplateController::class, 'show']);
    Route::get('/document-templates/{document_template}/export', [\App\Http\Controllers\Api\DocumentTemplateController::class, 'export']);
        Route::get('/dashboard', [DashboardController::class, 'index']);
        Route::get('/dashboard/daily-revenue', [DashboardController::class, 'dailyRevenue']);

        Route::get('/company-settings', [CompanySettingController::class, 'show']);
        Route::post('/company-settings', [CompanySettingController::class, 'update']);

        Route::get('/clients/autocomplete', [ClientController::class, 'autocomplete']);
        Route::apiResource('clients', ClientController::class);
        Route::get('/clients/{client}/sous-clients', [SousClientController::class, 'index']);
        Route::post('/clients/{client}/sous-clients', [SousClientController::class, 'store']);
        Route::put('/sous-clients/{sousClient}', [SousClientController::class, 'update']);
        Route::delete('/sous-clients/{sousClient}', [SousClientController::class, 'destroy']);

        Route::get('/articles/stats', [ArticleController::class, 'stats']);
        Route::get('/articles/distinct-units', [ArticleController::class, 'distinctUnits']);
        Route::get('/articles/autocomplete', [ArticleController::class, 'autocomplete']);
        Route::apiResource('articles', ArticleController::class);
        Route::get('/articles/{article}/history', [ArticleController::class, 'history']);
        Route::get('/articles/{article}/matricules', [ArticleMatriculeController::class, 'index']);
        Route::get('/articles/{article}/matricules/autocomplete', [ArticleMatriculeController::class, 'autocomplete']);
        Route::post('/articles/{article}/matricules', [ArticleMatriculeController::class, 'store']);
        Route::delete('/article-matricules/{articleMatricule}', [ArticleMatriculeController::class, 'destroy']);

        Route::post('/devis/bulk-pdf', [DevisController::class, 'bulkDownloadPdf']);
        Route::get('/devis/next-reference', [DevisController::class, 'nextReference']);
        Route::put('/devis/next-reference', [DevisController::class, 'setNextReference']);
        Route::get('/devis/{devis}/pdf', [DevisController::class, 'downloadPdf']);
        Route::post('/devis/{devis}/convert', [DevisController::class, 'convert']);
        Route::post('/devis/{devis}/duplicate', [DevisController::class, 'duplicate']);
        Route::apiResource('devis', DevisController::class)->parameters(['devis' => 'devis']);

        Route::post('/facture/bulk-pdf', [FactureController::class, 'bulkDownloadPdf']);
        Route::get('/facture/next-reference', [FactureController::class, 'nextReference']);
        Route::put('/facture/next-reference', [FactureController::class, 'setNextReference']);
        Route::get('/facture/{facture}/pdf', [FactureController::class, 'downloadPdf']);
        Route::put('/facture/{facture}/payment', [FactureController::class, 'recordPayment']);
        Route::apiResource('facture', FactureController::class)->parameters(['facture' => 'facture']);
    });
});