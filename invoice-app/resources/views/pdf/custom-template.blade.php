<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        @page {
            size: {{ $pageFormat ?? 'A4' }};
            margin: 0;
        }
        body { margin: 0; padding: 15mm; }
        {!! file_get_contents(public_path('template-print.css')) !!}
    </style>
</head>
<body>
<div class="tpl-print-content">
{!! $renderedContent !!}
</div>
</body>
</html>