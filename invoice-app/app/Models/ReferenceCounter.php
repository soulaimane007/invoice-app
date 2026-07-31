<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReferenceCounter extends Model
{
    protected $table = 'reference_counters';

    protected $fillable = ['organization_id', 'document_type', 'year', 'last_number'];
}